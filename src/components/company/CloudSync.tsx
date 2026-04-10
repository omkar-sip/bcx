import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCompanyInputStore } from '../../store/companyInputStore';
import { getDocument, upsertDocument } from '../../lib/firestore';

const LOCAL_COMPANY_INPUT_PREFIX = 'bcx_company_inputs_v1:';

const getLocalBackupKey = (uid: string) => `${LOCAL_COMPANY_INPUT_PREFIX}${uid}`;

const readLocalBackup = (uid: string) => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(getLocalBackupKey(uid));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(getLocalBackupKey(uid));
    return null;
  }
};

const writeLocalBackup = (uid: string, payload: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getLocalBackupKey(uid), JSON.stringify(payload));
};

export const CloudSync = () => {
  const { user } = useAuthStore();
  const store = useCompanyInputStore();
  const lastSavedRef = useRef<string>('');
  const isInitialLoad = useRef(true);

  // 1. Initial Data Rehydration
  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      const localBackup = readLocalBackup(user.uid);

      try {
        if (localBackup) {
          store.loadFromCloud(localBackup);
          lastSavedRef.current = JSON.stringify(localBackup);
        }

        const cloudData = await getDocument('telemetry_data', user.uid);
        if (cloudData) {
          store.loadFromCloud(cloudData);
          writeLocalBackup(user.uid, cloudData);
          lastSavedRef.current = JSON.stringify(cloudData);
        }
      } catch (e) {
        console.error('Cloud Sync: Load failed', e);
      } finally {
        isInitialLoad.current = false;
      }
    };
    load();
  }, [user?.uid]);

  // 2. Debounced Save to Firestore
  useEffect(() => {
    if (isInitialLoad.current || !user?.uid) return;

    const serializeState = () => {
      const { reportingYear, industry, country, scope1, scope2, scope3, locations, vehicles, bulkImports } = store;
      return JSON.stringify({ reportingYear, industry, country, scope1, scope2, scope3, locations, vehicles, bulkImports });
    };

    const currentState = serializeState();
    if (currentState === lastSavedRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const payload = JSON.parse(currentState);
        writeLocalBackup(user.uid, payload);
        await upsertDocument('telemetry_data', user.uid, payload);
        lastSavedRef.current = currentState;
        console.log('Cloud Sync: State saved to Firestore');
      } catch (e) {
        console.error('Cloud Sync: Save failed', e);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [store, user?.uid]);

  return null;
};
