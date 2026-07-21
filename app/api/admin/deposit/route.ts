/* ------------------------------------------------------------------ *
 * Dépôt depuis l'assistant : fichier original + résumé (généré en PDF),
 * dans le dossier choisi, avec UNE seule notification au client.
 * POST multipart : file, subaccount, folder?, summary?
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { uploadDocument } from "@/lib/documents";
import { emailsForSubaccount } from "@/lib/owners-admin";
import { brandedBody, sendBrandedEmail } from "@/lib/email";
import { summaryPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL = "https://lmgestionimmobiliere.ca";

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const file = form.get("file");
  const subaccount = String(form.get("subaccount") ?? "").trim();
  const folder = String(form.get("folder") ?? "").trim();
  const summary = String(form.get("summary") ?? "").trim();
  if (!subaccount) return Response.json({ error: "Client manquant." }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "Fichier manquant." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return Response.json({ error: "Fichier trop volumineux (max 25 Mo)." }, { status: 400 });

  const deposited: string[] = [];
  try {
    // 1) Fichier original
    const buffer = Buffer.from(await file.arrayBuffer());
    const base = (file.name || "document").replace(/\.[^.]+$/, "");
    await uploadDocument({
      subaccount,
      filename: file.name || "document",
      contentType: file.type || "application/octet-stream",
      buffer,
      folder,
      uploadedBy: id.email,
    });
    deposited.push(file.name || "document");

    // 2) Résumé en PDF (si présent)
    if (summary) {
      const dateLabel = new Date().toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
      const pdf = await summaryPdf({ title: `Résumé — ${base}`, body: summary, dateLabel: `Généré le ${dateLabel}` });
      await uploadDocument({
        subaccount,
        filename: `Résumé - ${base}.pdf`,
        contentType: "application/pdf",
        buffer: Buffer.from(pdf),
        folder,
        uploadedBy: id.email,
      });
      deposited.push(`Résumé - ${base}.pdf`);
    }

    // 3) UNE notification au client
    const emails = await emailsForSubaccount(subaccount).catch(() => []);
    if (emails.length) {
      const items = deposited.map((d) => `• ${d}`).join("<br/>");
      const html = brandedBody({
        heading: deposited.length > 1 ? "De nouveaux documents sont disponibles" : "Un nouveau document est disponible",
        paragraphs: [
          "Bonjour,",
          `${deposited.length > 1 ? "De nouveaux documents ont" : "Un nouveau document a"} été déposé${deposited.length > 1 ? "s" : ""} dans votre espace client :`,
          `<span style="color:#0b0b0c;">${items}</span>`,
          "Connectez-vous pour les consulter et les télécharger.",
        ],
        ctaText: "Accéder à mon tableau de bord",
        ctaUrl: `${SITE_URL}/connexion`,
        preheader: "Nouveau document dans votre espace client",
      });
      const text = `Bonjour,\n\nDocument(s) déposé(s) dans votre espace client :\n${deposited.map((d) => `- ${d}`).join("\n")}\n\nConnectez-vous : ${SITE_URL}/connexion`;
      await Promise.allSettled(emails.map((to) => sendBrandedEmail({ to, subject: "Nouveau document — LM Gestion Immobilière", html, text })));
    }

    return Response.json({ ok: true, deposited, notified: emails.length });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
