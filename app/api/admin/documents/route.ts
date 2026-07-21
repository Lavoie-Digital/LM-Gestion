/* ------------------------------------------------------------------ *
 * Documents clients — gestion (admin) :
 *   GET    ?subaccount=  → liste les documents d'un sous-compte
 *   POST   (multipart: file, subaccount) → dépose + notifie le(s) client(s)
 *   DELETE { id }        → supprime
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { deleteDocument, listDocuments, listFolders, uploadDocument } from "@/lib/documents";
import { emailsForSubaccount } from "@/lib/owners-admin";
import { brandedBody, sendBrandedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL = "https://lmgestionimmobiliere.ca";

export async function GET(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  const subaccount = new URL(request.url).searchParams.get("subaccount")?.trim() || "";
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });
  try {
    const [documents, folders] = await Promise.all([listDocuments([subaccount]), listFolders(subaccount)]);
    return Response.json({ documents, folders });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Requête invalide (multipart attendu)." }, { status: 400 });
  }
  const file = form.get("file");
  const subaccount = String(form.get("subaccount") ?? "").trim();
  const folder = String(form.get("folder") ?? "").trim();
  if (!subaccount) return Response.json({ error: "Sous-compte manquant." }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "Fichier manquant." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return Response.json({ error: "Fichier trop volumineux (max 25 Mo)." }, { status: 400 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const doc = await uploadDocument({
      subaccount,
      filename: file.name || "document",
      contentType: file.type || "application/octet-stream",
      buffer,
      folder,
      uploadedBy: id.email,
    });

    // Notification courriel aux client(s) associé(s) — sans bloquer la réponse.
    const emails = await emailsForSubaccount(subaccount).catch(() => []);
    const html = brandedBody({
      heading: "Un nouveau document est disponible",
      paragraphs: [
        "Bonjour,",
        `Un nouveau document — <strong style="color:#0b0b0c;">${doc.name}</strong> — vient d'être déposé dans votre espace client.`,
        "Connectez-vous à votre tableau de bord pour le consulter et le télécharger.",
      ],
      ctaText: "Accéder à mon tableau de bord",
      ctaUrl: `${SITE_URL}/connexion`,
      preheader: `Nouveau document : ${doc.name}`,
    });
    const text = `Bonjour,\n\nUn nouveau document (${doc.name}) est disponible dans votre espace client.\nConnectez-vous : ${SITE_URL}/connexion\n\nLM Gestion Immobilière`;
    await Promise.allSettled(
      emails.map((to) =>
        sendBrandedEmail({ to, subject: "Nouveau document disponible — LM Gestion Immobilière", html, text })
      )
    );

    return Response.json({ ok: true, document: doc, notified: emails.length });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = await verifyBearer(request);
  if (!id) return Response.json({ error: "Non authentifié." }, { status: 401 });
  if (!id.isAdmin) return Response.json({ error: "Réservé aux admins." }, { status: 403 });

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
  try {
    await deleteDocument(body.id);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
