import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

const canUseFirestore = () => Boolean(db);

export const getDocument = async <T = DocumentData>(
  path: string,
  id: string
): Promise<T | null> => {
  if (!canUseFirestore() || !db) {
    return null;
  }
  const ref = doc(db, path, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as T;
};

export const upsertDocument = async (
  path: string,
  id: string,
  payload: Record<string, unknown>
): Promise<void> => {
  if (!canUseFirestore() || !db) {
    return;
  }
  const ref = doc(db, path, id);
  await setDoc(ref, payload, { merge: true });
};

export const patchDocument = async (
  path: string,
  id: string,
  payload: Record<string, unknown>
): Promise<void> => {
  if (!canUseFirestore() || !db) {
    return;
  }
  const ref = doc(db, path, id);
  await updateDoc(ref, payload);
};

export const listCollection = async <T = DocumentData>(path: string): Promise<T[]> => {
  if (!canUseFirestore() || !db) {
    return [];
  }
  const snapshot = await getDocs(collection(db, path));
  return snapshot.docs.map((item) => item.data() as T);
};
