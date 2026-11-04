/* ------------------------------------------------------------------ *
 * Boîte de réception des notes (admin) : tous les fils de tous les clients,
 * avec leur statut, l'employé assigné et le suivi (lu / vu / courriel).
 *   GET → { threads, team, me }
 * ------------------------------------------------------------------ */

import { ADMIN_EMAILS, verifyBearer } from "@/lib/access";
import { listDbAdmins } from "@/lib/admins";
import { groupThreads, listNotes } from "@/lib/notes";
import { releaseAndNotifyNotes } from "@/lib/note-mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  try {
    // Libération des notes programmées EN PARALLÈLE de la lecture (ne bloque plus
    // l'affichage ; une note tout juste libérée apparaît au rafraîchissement suivant).
    const [notes, dbAdmins] = await Promise.all([
      listNotes(null),
      listDbAdmins().catch(() => []),
      releaseAndNotifyNotes().catch(() => 0),
    ]);
    // Équipe = admins permanents + admins ajoutés (cibles possibles d'une assignation).
    const team = [...new Set([...ADMIN_EMAILS, ...dbAdmins.map((a) => a.email.toLowerCase())])];
    return Response.json({ threads: groupThreads(notes), team, me: id.email });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
