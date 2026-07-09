/* ------------------------------------------------------------------ *
 * Documents visibles par l'utilisateur connecté (client ou admin).
 * Scoping identique au tableau de bord : admin → tout (ou viewAs) ;
 * propriétaire → ses sous-comptes uniquement. URL de téléchargement signées.
 * ------------------------------------------------------------------ */

import { authConfigured } from "@/lib/firebase-admin";
import { verifyBearer } from "@/lib/access";
import { subaccountsForOwnerEmail } from "@/lib/owners-admin";
import { listDocuments } from "@/lib/documents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authConfigured()) return Response.json({ documents: [] });
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });

  const viewAs = new URL(request.url).searchParams.get("viewAs")?.trim() || "";
  const subaccounts = id.isAdmin
    ? viewAs
      ? [viewAs]
      : null
    : await subaccountsForOwnerEmail(id.email);

  try {
    return Response.json({ documents: await listDocuments(subaccounts) });
  } catch (err) {
    return Response.json({ documents: [], error: (err as Error).message }, { status: 502 });
  }
}
