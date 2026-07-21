/* ------------------------------------------------------------------ *
 * Aperçu du résumé en PDF (admin). POST { summary, filename? } → PDF.
 * Même rendu que le PDF déposé (lib/pdf). Sert uniquement à prévisualiser.
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { summaryPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let body: { summary?: string; filename?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const summary = (body.summary ?? "").trim();
  if (!summary) return Response.json({ error: "Résumé vide." }, { status: 400 });
  const base = (body.filename ?? "document").replace(/\.[^.]+$/, "");
  const dateLabel = new Date().toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });

  try {
    const pdf = await summaryPdf({ title: `Résumé — ${base}`, body: summary, dateLabel: `Généré le ${dateLabel}` });
    return new Response(Buffer.from(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="apercu.pdf"` },
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
