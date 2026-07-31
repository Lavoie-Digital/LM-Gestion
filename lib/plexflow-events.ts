/* ------------------------------------------------------------------ *
 * Mapping des événements webhook PlexFlow → projections (état courant).
 *
 * Fonctions PURES (aucune I/O) → testables. Le format est confirmé par de vrais
 * événements reçus (voir [app/api/webhooks/plexflow/route.ts]) :
 *   { eventId, eventType, entityId, timestamp, data{ PascalCase... } }
 * Montants en CENTS. Identité propriétaire = data.AccountId / data.AccountName.
 * ------------------------------------------------------------------ */

export type PlexflowEvent = {
  eventId?: string;
  eventType?: string;
  entityId?: string;
  timestamp?: string;
  data?: Record<string, unknown>;
};

export type UnitStatus = "occupied" | "vacant" | "unknown";

export type UnitProjection = {
  unitId: string;
  propertyId?: string;
  propertyNickname?: string;
  propertyAddress?: string;
  unitNickname?: string;
  apptNb?: string;
  unitAddress?: string;
  accountId?: string; // sous-compte = propriétaire
  accountName?: string;
  topLevelAccountId?: string; // compte maître = gestionnaire
  status: UnitStatus;
  currentRentCents: number;
  lastEventType?: string;
  updatedAt?: string;
};

export type TenantProjection = {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  tenantType?: string;
  status?: string;
  accountId?: string;
  active?: boolean;
  lastEventType?: string;
  updatedAt?: string;
};

export type ActivityItem = {
  id: string;
  eventType?: string;
  label: string;
  detail: string;
  at?: string;
  accountId?: string;
};

/** Libellés FR des événements (le nom brut est en repli). */
export const EVENT_LABELS: Record<string, string> = {
  // Contacts / prospects
  prospective_tenant_created: "Contact prospect créé",
  prospective_tenant_modified: "Contact prospect modifié",
  prospect_contact_created: "Contact prospect créé",
  prospect_contact_modified: "Contact prospect modifié",
  // Commentaires / notes
  comment_created: "Commentaire ajouté",
  comment_modified: "Commentaire modifié",
  comment_deleted: "Commentaire supprimé",
  note_created: "Note ajoutée",
  note_deleted: "Note supprimée",
  // Baux
  lease_created: "Bail créé",
  lease_renewed: "Bail renouvelé",
  lease_modified: "Bail modifié",
  lease_ended: "Bail terminé",
  // Locataires
  tenant_confirmed: "Locataire confirmé",
  tenant_activated: "Locataire activé",
  tenant_deactivated: "Locataire désactivé",
  tenant_created: "Locataire créé",
  tenant_deleted: "Locataire supprimé",
  tenant_modified: "Locataire modifié",
  // Demandes de service
  service_request_created: "Demande de service créée",
  service_request_modified: "Demande de service modifiée",
  service_request_closed: "Demande de service fermée",
  service_request_deleted: "Demande de service supprimée",
  service_request_note_created: "Note de demande créée",
  service_request_note_deleted: "Note de demande supprimée",
  // Paiements
  payment_received: "Paiement reçu",
  payment_modified: "Paiement modifié",
  payment_failed: "Paiement échoué",
  payment_refunded: "Paiement remboursé",
  payment_deleted: "Paiement supprimé",
  // Unités
  unit_vacancy_started: "Logement devenu vacant",
  unit_vacancy_ended: "Logement occupé",
  unit_occupied: "Logement occupé",
};

/** Repli en français lisible pour un type d'événement non mappé (jamais l'anglais brut). */
function frenchFallback(eventType: string): string {
  const t = eventType.toLowerCase();
  const subject = t.includes("payment")
    ? "Paiement"
    : t.includes("lease")
      ? "Bail"
      : t.includes("tenant") || t.includes("prospect")
        ? "Locataire"
        : t.includes("unit") || t.includes("vacancy")
          ? "Logement"
          : t.includes("service")
            ? "Demande de service"
            : t.includes("comment") || t.includes("note")
              ? "Note"
              : t.includes("document")
                ? "Document"
                : "Activité";
  const action = t.endsWith("created") || t.includes("_created")
    ? "· nouveau"
    : t.includes("modified") || t.includes("updated")
      ? "· modifié"
      : t.includes("deleted")
        ? "· supprimé"
        : t.includes("closed")
          ? "· fermé"
          : "";
  return action ? `${subject} ${action}` : subject;
}

export function eventLabel(eventType?: string): string {
  if (!eventType) return "Événement";
  return EVENT_LABELS[eventType] ?? frenchFallback(eventType);
}

function str(v: unknown): string | undefined {
  return v === undefined || v === null || v === "" ? undefined : String(v);
}
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * Patch d'unité (merge) déduit d'un événement, ou null si l'événement ne
 * concerne pas une unité identifiable.
 */
export function unitProjectionFromEvent(
  evt: PlexflowEvent
): (Partial<UnitProjection> & { unitId: string }) | null {
  const d = evt.data ?? {};
  const unitIdRaw = d.UnitId ?? d.unitId;
  if (unitIdRaw === undefined || unitIdRaw === null) return null;

  const patch: Partial<UnitProjection> & { unitId: string } = { unitId: String(unitIdRaw) };
  const set = <K extends keyof UnitProjection>(k: K, v: UnitProjection[K] | undefined) => {
    if (v !== undefined) (patch as UnitProjection)[k] = v;
  };
  set("propertyId", str(d.PropertyId));
  set("propertyNickname", str(d.PropertyNickname));
  set("propertyAddress", str(d.PropertyAddress));
  set("unitNickname", str(d.UnitNickname));
  set("apptNb", str(d.UnitApptNb));
  set("unitAddress", str(d.UnitAddress));
  set("accountId", str(d.AccountId));
  set("accountName", str(d.AccountName));
  set("topLevelAccountId", str(d.TopLevelAccountId));
  set("lastEventType", evt.eventType);
  set("updatedAt", evt.timestamp);

  const et = (evt.eventType ?? "").toLowerCase();
  if (et.includes("vacancy_started") || et.includes("vacated")) {
    patch.status = "vacant";
    patch.currentRentCents = 0;
  } else if (et.includes("vacancy_ended") || et.includes("occupied") || et.includes("rented")) {
    patch.status = "occupied";
    const rent = num(d.NewRentAmountInCents) ?? num(d.CurrentRentTotalCents);
    if (rent !== undefined) patch.currentRentCents = rent;
  }
  return patch;
}

/** Patch de locataire (merge) pour les événements `tenant_*`, sinon null. */
export function tenantProjectionFromEvent(
  evt: PlexflowEvent
): (Partial<TenantProjection> & { userId: string }) | null {
  const et = (evt.eventType ?? "").toLowerCase();
  if (!et.startsWith("tenant")) return null;
  const d = evt.data ?? {};
  const userIdRaw = d.UserId ?? d.userId ?? evt.entityId;
  if (userIdRaw === undefined || userIdRaw === null) return null;

  const patch: Partial<TenantProjection> & { userId: string } = { userId: String(userIdRaw) };
  const set = <K extends keyof TenantProjection>(k: K, v: TenantProjection[K] | undefined) => {
    if (v !== undefined) (patch as TenantProjection)[k] = v;
  };
  set("firstName", str(d.FirstName));
  set("lastName", str(d.LastName));
  set("email", str(d.Email));
  set("phoneNumber", str(d.PhoneNumber));
  set("tenantType", str(d.TenantType));
  set("status", str(d.Status));
  set("accountId", str(d.AccountId));
  set("lastEventType", evt.eventType);
  set("updatedAt", evt.timestamp);
  if (et.includes("deactivated") || et.includes("deleted")) patch.active = false;
  else if (et.includes("activated") || et.includes("confirmed")) patch.active = true;
  return patch;
}

/** Élément de fil d'activité lisible, déduit d'un événement. */
export function activityFromEvent(evt: PlexflowEvent): ActivityItem {
  const d = evt.data ?? {};
  const label = eventLabel(evt.eventType);
  const parts: string[] = [];

  const unit = str(d.UnitNickname) ?? str(d.UnitApptNb);
  const property = str(d.PropertyNickname);
  if (unit || property) parts.push([unit && `Logement ${unit}`, property].filter(Boolean).join(" · "));

  const tenant = [str(d.FirstName), str(d.LastName)].filter(Boolean).join(" ");
  if (tenant) parts.push(tenant);

  const amountCents = num(d.AmountInCents) ?? num(d.NewRentAmountInCents) ?? num(d.PreviousRentAmountInCents);
  if (amountCents !== undefined && (evt.eventType ?? "").toLowerCase().includes("payment")) {
    parts.push(`${Math.round(amountCents / 100).toLocaleString("fr-CA")} $`);
  }

  return {
    id: str(evt.eventId) ?? `${evt.eventType}-${evt.entityId}`,
    eventType: evt.eventType,
    label,
    detail: parts.join(" — "),
    at: evt.timestamp,
    accountId: str(d.AccountId),
  };
}
