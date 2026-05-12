import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendEmailVerification, GoogleAuthProvider,
  signInWithPopup, onAuthStateChanged,
} from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasUsername: boolean | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubSnapshot) { unsubSnapshot(); unsubSnapshot = null; }

      if (u && !u.emailVerified && u.providerData[0]?.providerId === "password") {
        setUser(null);
        setHasUsername(null);
        setLoading(false);
      } else if (u) {
        setUser(u);
        unsubSnapshot = onSnapshot(doc(db, "users", u.uid), (snap) => {
          setHasUsername(!!(snap.exists() && snap.data()?.username));
          setLoading(false);
        });
      } else {
        setUser(null);
        setHasUsername(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
  };

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      const err: any = new Error("Email not verified");
      err.code = "auth/email-not-verified";
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const resendVerificationEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasUsername, signUp, signIn, signInWithGoogle, resendVerificationEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
