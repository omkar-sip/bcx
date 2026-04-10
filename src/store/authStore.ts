import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User
} from 'firebase/auth';
import { create } from 'zustand';
import { auth, firebaseEnabled } from '../lib/firebase';
import {
  clearSessionEmail,
  createId,
  getSessionEmail,
  readDatabase,
  setSessionEmail,
  writeDatabase
} from '../data/mockDb';
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
  signOut: () => Promise<void>;
  onAuthStateChange: () => () => void;
}

const toAuthUser = (profile: UserProfile): AuthUser => ({
  uid: profile.uid,
  email: profile.email,
  displayName: profile.name
});

const profileByUid = (uid: string): UserProfile | null => {
  const db = readDatabase();
  const account = Object.values(db.accounts).find((item) => item.profile.uid === uid);
  return account?.profile ?? null;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  userProfile: null,
  loading: true,
  authReady: false,
  signIn: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    set({ loading: true });

    if (firebaseEnabled && auth) {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const baseProfile = profileByUid(credential.user.uid);
      const fallbackName = credential.user.displayName ?? normalizedEmail.split('@')[0];
      const userProfile: UserProfile =
        baseProfile ?? {
          uid: credential.user.uid,
          name: fallbackName,
          email: normalizedEmail,
          role: 'employee',
          company: null,
          createdAt: new Date()
        };

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
      return;
    }

    const db = readDatabase();
    const account = db.accounts[normalizedEmail];
    if (!account || account.password !== password) {
      set({ loading: false });
      throw new Error('Invalid credentials.');
    }

    setSessionEmail(normalizedEmail);
    set({
      user: toAuthUser(account.profile),
      userProfile: account.profile,
      loading: false,
      authReady: true
    });
  },
  signUp: async ({ name, email, password, role, company }) => {
    const normalizedEmail = email.trim().toLowerCase();
    set({ loading: true });

    if (firebaseEnabled && auth) {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await updateProfile(credential.user, { displayName: name });

      const profile: UserProfile = {
        uid: credential.user.uid,
        name,
        email: normalizedEmail,
        role,
        company: role === 'employee' ? company?.trim() ?? null : role === 'company' ? name : null,
        createdAt: new Date()
      };

      const db = readDatabase();
      db.accounts[normalizedEmail] = { profile, password };
      if (role === 'employee') {
        db.employeeByUid[profile.uid] = { actions: [], score: 0, rank: 1 };
      }
      if (role === 'company') {
        db.companyByUid[profile.uid] = {
          bcxIndex: 0,
          creditsPurchased: 0,
          transactions: [],
          employeeCount: 0,
          totalScore: 0
        };
      }
      if (role === 'farmer') {
        db.farmerByUid[profile.uid] = {
          availableCredits: 0,
          soldCredits: 0,
          earnings: 0,
          saleHistory: []
        };
      }
      writeDatabase(db);

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
      return;
    }

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
      createdAt: new Date()
    };

    db.accounts[normalizedEmail] = { profile, password };
    if (role === 'employee') {
      db.employeeByUid[profile.uid] = { actions: [], score: 0, rank: 1 };
    }
    if (role === 'company') {
      db.companyByUid[profile.uid] = {
        bcxIndex: 0,
        creditsPurchased: 0,
        transactions: [],
        employeeCount: 0,
        totalScore: 0
      };
    }
    if (role === 'farmer') {
      db.farmerByUid[profile.uid] = {
        availableCredits: 0,
        soldCredits: 0,
        earnings: 0,
        saleHistory: []
      };
    }
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
    set({
      user: null,
      userProfile: null,
      loading: false,
      authReady: true
    });
  },
  onAuthStateChange: () => {
    if (firebaseEnabled && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) {
          clearSessionEmail();
          set({
            user: null,
            userProfile: null,
            loading: false,
            authReady: true
          });
          return;
        }

        const db = readDatabase();
        const account = Object.values(db.accounts).find(
          (item) => item.profile.uid === firebaseUser.uid
        );
        if (account) {
          setSessionEmail(account.profile.email);
        }

        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          },
          userProfile:
            account?.profile ??
            ({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName ?? firebaseUser.email ?? 'User',
              email: firebaseUser.email ?? '',
              role: 'employee',
              company: null,
              createdAt: new Date()
            } as UserProfile),
          loading: false,
          authReady: true
        });
      });
      return unsubscribe;
    }

    const sessionEmail = getSessionEmail();
    if (!sessionEmail) {
      set({
        user: null,
        userProfile: null,
        loading: false,
        authReady: true
      });
      return () => undefined;
    }

    const db = readDatabase();
    const account = db.accounts[sessionEmail];
    if (!account) {
      clearSessionEmail();
      set({
        user: null,
        userProfile: null,
        loading: false,
        authReady: true
      });
      return () => undefined;
    }

    set({
      user: toAuthUser(account.profile),
      userProfile: account.profile,
      loading: false,
      authReady: true
    });
    return () => undefined;
  }
}));
