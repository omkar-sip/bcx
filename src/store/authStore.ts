import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User
} from 'firebase/auth';
import { create } from 'zustand';
import { auth, firebaseEnabled, googleProvider } from '../lib/firebase';
import {
  clearSessionEmail,
  createDefaultCompanySnapshot,
  createDefaultFarmerSnapshot,
  createId,
  getSessionEmail,
  readDatabase,
  setSessionEmail,
  writeDatabase
} from '../data/mockDb';
import { getDocument, upsertDocument } from '../lib/firestore';
import type { Role, UserProfile } from '../types';

type AuthUser = Pick<User, 'uid' | 'email' | 'displayName'>;

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  company?: string;
}

interface AuthStoreState {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignupPayload) => Promise<void>;
  signInWithGoogle: (role: Role) => Promise<void>;
  signInWithPhoneUid: (uid: string, phone: string, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
  onAuthStateChange: () => () => void;
  setProfile: (profile: UserProfile) => void;
}

const toAuthUser = (profile: UserProfile): AuthUser => ({
  uid: profile.uid,
  email: profile.email ?? null,
  displayName: profile.name
});

const profileByUid = (uid: string): UserProfile | null => {
  const db = readDatabase();
  const account = Object.values(db.accounts).find((item) => item.profile.uid === uid);
  return account?.profile ?? null;
};

const makeBlankProfile = (uid: string, name: string, email: string, role: Role): UserProfile => ({
  uid,
  name,
  email,
  role,
  company: null,
  profileComplete: false,
  createdAt: new Date()
});

/** Safe Firestore getter — never throws, returns null on any error */
const safeGetProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    return await getDocument<UserProfile>('users', uid);
  } catch {
    return null;
  }
};

/** Safe Firestore setter — never throws */
const safeSaveProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await upsertDocument('users', profile.uid, {
      ...profile,
      createdAt: profile.createdAt instanceof Date
        ? profile.createdAt.toISOString()
        : profile.createdAt
    });
  } catch {
    // Firestore unavailable — proceed anyway, data will sync later
  }
};

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  userProfile: null,
  loading: true,
  authReady: false,

  setProfile: (profile) => set({ userProfile: profile }),

  signIn: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    set({ loading: true });

    if (firebaseEnabled && auth) {
      try {
        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);

        // Try Firestore, fall back to mock DB, then blank profile
        let userProfile = await safeGetProfile(credential.user.uid);
        if (!userProfile) {
          const base = profileByUid(credential.user.uid);
          userProfile = base ?? makeBlankProfile(
            credential.user.uid,
            credential.user.displayName ?? normalizedEmail.split('@')[0],
            normalizedEmail,
            'employee'
          );
        }

        setSessionEmail(normalizedEmail);
        set({
          user: {
            uid: credential.user.uid,
            email: credential.user.email,
            displayName: credential.user.displayName
          },
          userProfile,
          loading: false,
          authReady: true
        });
      } catch (e) {
        set({ loading: false });
        throw e;
      }
      return;
    }

    // Mock DB fallback
    const db = readDatabase();
    const account = db.accounts[normalizedEmail];
    if (!account || account.password !== password) {
      set({ loading: false });
      throw new Error('Invalid credentials.');
    }

    setSessionEmail(normalizedEmail);
    set({
      user: toAuthUser(account.profile),
      userProfile: { ...account.profile, profileComplete: account.profile.profileComplete ?? true },
      loading: false,
      authReady: true
    });
  },

  signInWithGoogle: async (role) => {
    if (!firebaseEnabled || !auth) {
      throw new Error('Firebase not configured.');
    }
    set({ loading: true });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      let userProfile = await safeGetProfile(firebaseUser.uid);
      if (!userProfile) {
        userProfile = makeBlankProfile(
          firebaseUser.uid,
          firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
          firebaseUser.email ?? '',
          role
        );
        await safeSaveProfile(userProfile);
      }

      set({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        },
        userProfile,
        loading: false,
        authReady: true
      });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  signInWithPhoneUid: async (uid, phone, role) => {
    set({ loading: true });
    try {
      // Check Firestore for existing profile; create locally if it fails
      let userProfile = await safeGetProfile(uid);
      if (!userProfile) {
        userProfile = {
          ...makeBlankProfile(uid, '', '', role),
          phone,
          email: ''
        };
        await safeSaveProfile(userProfile);
      }

      set({
        user: { uid, email: userProfile.email ?? null, displayName: userProfile.name ?? null },
        userProfile,
        loading: false,
        authReady: true
      });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  signUp: async ({ name, email, password, role, company }) => {
    const normalizedEmail = email.trim().toLowerCase();
    set({ loading: true });

    if (firebaseEnabled && auth) {
      try {
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await updateProfile(credential.user, { displayName: name });

        const profile: UserProfile = {
          uid: credential.user.uid,
          name,
          email: normalizedEmail,
          role,
          company: role === 'employee' ? company?.trim() ?? null : role === 'company' ? name : null,
          profileComplete: false,
          createdAt: new Date()
        };

        await safeSaveProfile(profile);
        setSessionEmail(normalizedEmail);
        set({
          user: {
            uid: credential.user.uid,
            email: credential.user.email,
            displayName: credential.user.displayName
          },
          userProfile: profile,
          loading: false,
          authReady: true
        });
      } catch (e) {
        set({ loading: false });
        throw e;
      }
      return;
    }

    // Mock DB fallback
    const db = readDatabase();
    if (db.accounts[normalizedEmail]) {
      set({ loading: false });
      throw new Error('Email already exists.');
    }

    const profile: UserProfile = {
      uid: createId('usr'),
      name: name.trim(),
      email: normalizedEmail,
      role,
      company: role === 'employee' ? company?.trim() ?? null : role === 'company' ? name.trim() : null,
      profileComplete: false,
      createdAt: new Date()
    };

    db.accounts[normalizedEmail] = { profile, password };
    if (role === 'employee') db.employeeByUid[profile.uid] = { actions: [], score: 0, rank: 1 };
    if (role === 'company') db.companyByUid[profile.uid] = createDefaultCompanySnapshot();
    if (role === 'farmer') db.farmerByUid[profile.uid] = createDefaultFarmerSnapshot();

    writeDatabase(db);
    setSessionEmail(normalizedEmail);
    set({
      user: toAuthUser(profile),
      userProfile: profile,
      loading: false,
      authReady: true
    });
  },

  signOut: async () => {
    if (firebaseEnabled && auth) {
      await firebaseSignOut(auth);
    }
    clearSessionEmail();
    set({ user: null, userProfile: null, loading: false, authReady: true });
  },

  onAuthStateChange: () => {
    if (firebaseEnabled && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          clearSessionEmail();
          set({ user: null, userProfile: null, loading: false, authReady: true });
          return;
        }

        // Try Firestore, fall back gracefully — NEVER let this crash
        let userProfile = await safeGetProfile(firebaseUser.uid);

        if (!userProfile) {
          // If we already have a complete profile locally (e.g., just finished onboarding), KEEP IT
          const currentLocalProfile = get().userProfile;
          if (currentLocalProfile && currentLocalProfile.uid === firebaseUser.uid && currentLocalProfile.profileComplete) {
            userProfile = currentLocalProfile;
          } else {
            // Try mock DB (for demo accounts)
            const db = readDatabase();
            const account = Object.values(db.accounts).find(
              (item) => item.profile.uid === firebaseUser.uid
            );
            if (account) {
              userProfile = { ...account.profile, profileComplete: account.profile.profileComplete ?? true };
            } else {
              // Completely new user
              userProfile = makeBlankProfile(
                firebaseUser.uid,
                firebaseUser.displayName ?? firebaseUser.email ?? 'User',
                firebaseUser.email ?? '',
                'employee'
              );
            }
          }
        }

        if (userProfile.email) setSessionEmail(userProfile.email);

        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          },
          userProfile,
          loading: false,
          authReady: true
        });
      });
      return unsubscribe;
    }

    // Mock session fallback
    const sessionEmail = getSessionEmail();
    if (!sessionEmail) {
      set({ user: null, userProfile: null, loading: false, authReady: true });
      return () => undefined;
    }

    const db = readDatabase();
    const account = db.accounts[sessionEmail];
    if (!account) {
      clearSessionEmail();
      set({ user: null, userProfile: null, loading: false, authReady: true });
      return () => undefined;
    }

    set({
      user: toAuthUser(account.profile),
      userProfile: { ...account.profile, profileComplete: account.profile.profileComplete ?? true },
      loading: false,
      authReady: true
    });
    return () => undefined;
  }
}));
