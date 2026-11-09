"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

/* Nombre de demandes de contact jamais ouvertes (bulle de notification).
 * Partagé entre les composants (une seule requête à la fois, gardée 30 s). */

let last: { at: number; value: number } | null = null;
let inflight: Promise<number> | null = null;

async function fetchUnseen(getToken: () => Promise<string>): Promise<number> {
  if (last && Date.now() - last.at < 30_000) return last.value;
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await fetch("/api/admin/contact-requests?count=1", {
          headers: { Authorization: `Bearer ${await getToken()}` },
          cache: "no-store",
        });
        const data = await res.json();
        const value = typeof data.unseen === "number" ? data.unseen : 0;
        last = { at: Date.now(), value };
        return value;
      } catch {
        return last?.value ?? 0;
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}

export function useUnseenContacts(): number {
  const { user, isAdmin } = useAuth();
  const [count, setCount] = useState(last?.value ?? 0);

  useEffect(() => {
    if (!user || !isAdmin) return;
    let cancelled = false;
    const tick = () => fetchUnseen(() => user.getIdToken()).then((v) => !cancelled && setCount(v));
    tick();
    const id = setInterval(tick, 120_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user, isAdmin]);

  return isAdmin ? count : 0;
}
