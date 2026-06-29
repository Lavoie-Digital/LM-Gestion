"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { firebaseConfigured, getFirebaseAuth, googleProvider } from "./firebase";

/**
 * Liste blanche d'accès au tableau de bord (phase de développement).
 * Surchargée via NEXT_PUBLIC_ALLOWED_EMAILS (séparées par des virgules).
 */
export const ALLOWED_EMAILS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAILS || "xavier@lavoiedigital.ca"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Comptes administrateurs (zone admin : gestion des immeubles par client). */
export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "xavier@lavoiedigital.ca"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  isAllowed: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = firebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      isAllowed: Boolean(user?.email && ALLOWED_EMAILS.includes(user.email.toLowerCase())),
      isAdmin: Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())),
      signInWithGoogle: async () => {
        await signInWithPopup(getFirebaseAuth(), googleProvider);
      },
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      signOut: async () => {
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [user, loading, configured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return ctx;
}
