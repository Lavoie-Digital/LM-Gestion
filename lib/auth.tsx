"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
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
  /** Envoie un lien de connexion sans mot de passe (crée le compte au 1er clic). */
  sendLoginLink: (email: string) => Promise<void>;
  /** À l'ouverture d'un lien magique : termine la connexion. Renvoie true si traité. */
  completeEmailLinkSignIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const EMAIL_LINK_KEY = "lm_email_link";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Accès déterminé côté serveur (/api/access) : admin OU propriétaire lié.
  // null = pas encore résolu (tant qu'un utilisateur est connecté).
  const [access, setAccess] = useState<{ allowed: boolean; isAdmin: boolean } | null>(null);
  const configured = firebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [configured]);

  // Résout l'accès via le serveur (repli sur la liste blanche env si indisponible).
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setAccess(null);
      return;
    }
    setAccess(null);
    (async () => {
      const email = user.email?.toLowerCase();
      const envFallback = {
        allowed: Boolean(email && ALLOWED_EMAILS.includes(email)),
        isAdmin: Boolean(email && ADMIN_EMAILS.includes(email)),
      };
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/access", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (cancelled) return;
        setAccess(
          typeof data?.allowed === "boolean"
            ? { allowed: data.allowed, isAdmin: Boolean(data.isAdmin) }
            : envFallback
        );
      } catch {
        if (!cancelled) setAccess(envFallback);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: authLoading || (Boolean(user) && access === null),
      configured,
      isAllowed: access?.allowed ?? false,
      isAdmin: access?.isAdmin ?? false,
      signInWithGoogle: async () => {
        await signInWithPopup(getFirebaseAuth(), googleProvider);
      },
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      sendLoginLink: async (email) => {
        const clean = email.trim().toLowerCase();
        await sendSignInLinkToEmail(getFirebaseAuth(), clean, {
          url: `${window.location.origin}/connexion`,
          handleCodeInApp: true,
        });
        window.localStorage.setItem(EMAIL_LINK_KEY, clean);
      },
      completeEmailLinkSignIn: async () => {
        const auth = getFirebaseAuth();
        if (!isSignInWithEmailLink(auth, window.location.href)) return false;
        let email = window.localStorage.getItem(EMAIL_LINK_KEY);
        if (!email) email = window.prompt("Confirmez votre courriel pour terminer la connexion :") || "";
        if (!email) return false;
        await signInWithEmailLink(auth, email.trim().toLowerCase(), window.location.href);
        window.localStorage.removeItem(EMAIL_LINK_KEY);
        return true;
      },
      signOut: async () => {
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [user, authLoading, access, configured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return ctx;
}
