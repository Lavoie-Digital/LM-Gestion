import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

/* ------------------------------------------------------------------ *
 * Modèle multi-tenant (Firestore) : profils clients (propriétaires) et
 * immeubles, avec assignation immeuble → propriétaire. Chaque client ne voit
 * que les immeubles dont il est le propriétaire (filtrage par ownerId).
 *
 * Plus tard : les immeubles seront ingérés automatiquement depuis PlexFlow
 * (propertyId), avec auto-assignation possible via le champ `subaccount`.
 * ------------------------------------------------------------------ */

/** Profil client (propriétaire d'immeubles). */
export type Owner = {
  id: string;
  name: string;
  email: string;
  /** Sous-compte PlexFlow (nom exact = champ `subaccount` de l'API) → filtre le parc du client. */
  plexflowSubaccount?: string | null;
};

/** Immeuble géré, assigné (ou non) à un propriétaire. */
export type Building = {
  id: string;
  name: string;
  city?: string;
  /** Profil client propriétaire (null = non assigné). */
  ownerId?: string | null;
  /** Identifiants PlexFlow (pour le rapprochement automatique futur). */
  plexflowPropertyId?: string | null;
  subaccount?: string | null;
};

const db = () => getFirebaseDb();

export async function listOwners(): Promise<Owner[]> {
  const snap = await getDocs(query(collection(db(), "owners"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Owner, "id">) }));
}

export async function addOwner(data: {
  name: string;
  email: string;
  plexflowSubaccount?: string;
}): Promise<void> {
  await addDoc(collection(db(), "owners"), {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    plexflowSubaccount: data.plexflowSubaccount?.trim() || null,
    createdAt: serverTimestamp(),
  });
}

export async function deleteOwner(id: string): Promise<void> {
  await deleteDoc(doc(db(), "owners", id));
}

export async function listBuildings(): Promise<Building[]> {
  const snap = await getDocs(query(collection(db(), "buildings"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Building, "id">) }));
}

export async function addBuilding(data: { name: string; city?: string }): Promise<void> {
  await addDoc(collection(db(), "buildings"), {
    name: data.name.trim(),
    city: data.city?.trim() ?? "",
    ownerId: null,
    createdAt: serverTimestamp(),
  });
}

export async function assignBuilding(buildingId: string, ownerId: string | null): Promise<void> {
  await updateDoc(doc(db(), "buildings", buildingId), { ownerId: ownerId || null });
}

export async function deleteBuilding(id: string): Promise<void> {
  await deleteDoc(doc(db(), "buildings", id));
}
