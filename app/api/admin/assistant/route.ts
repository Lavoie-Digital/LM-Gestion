/* ------------------------------------------------------------------ *
 * Assistant Claude (admin). POST multipart :
 *   - messages : JSON [{role, content}]
 *   - file     : (optionnel) fichier joint (PDF, image, texte)
 * Renvoie { reply }. Ne dépose rien — le dépôt se fait via /api/admin/documents.
 * ------------------------------------------------------------------ */

import { verifyBearer } from "@/lib/access";
import { runAssistant, type ChatMessage } from "@/lib/assistant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  let messages: ChatMessage[] = [];
  try {
    messages = JSON.parse(String(form.get("messages") ?? "[]"));
  } catch {
    return Response.json({ error: "Messages invalides." }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Aucun message." }, { status: 400 });
  }

  const f = form.get("file");
  let file;
  if (f instanceof File) {
    if (f.size > 15 * 1024 * 1024) return Response.json({ error: "Fichier trop volumineux (max 15 Mo)." }, { status: 400 });
    file = { base64: Buffer.from(await f.arrayBuffer()).toString("base64"), mediaType: f.type || "application/octet-stream", name: f.name || "fichier" };
  }

  try {
    const reply = await runAssistant(messages.slice(-12), file);
    return Response.json({ reply });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
