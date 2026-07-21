/* ------------------------------------------------------------------ *
 * Assistant Claude (zone admin) — résume/rédige à partir d'un document.
 * La clé ANTHROPIC_API_KEY reste serveur. Le dépôt dans un dossier client se
 * fait ensuite via /api/admin/documents (avec confirmation côté interface).
 * ------------------------------------------------------------------ */

import Anthropic from "@anthropic-ai/sdk";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AssistantFile = { base64: string; mediaType: string; name: string };

const SYSTEM = `Tu es l'assistante interne de LM Gestion Immobilière, une société de gestion immobilière au Québec.
Tu aides la gestionnaire à : résumer des documents (factures, baux, états de compte…), rédiger des notes claires pour les propriétaires, et préparer des dépôts de documents.
Réponds toujours en français, de façon concise, professionnelle et structurée. Quand on te demande un résumé, donne les points clés (montants, dates, parties, échéances) puis une courte synthèse.
Tu ne déposes jamais rien toi-même : tu prépares le contenu, et la gestionnaire confirme le dépôt dans l'interface.`;

function fileBlock(file: AssistantFile): Anthropic.ContentBlockParam | null {
  const mt = file.mediaType.toLowerCase();
  if (mt === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.base64 } };
  }
  if (mt.startsWith("image/")) {
    return {
      type: "image",
      source: { type: "base64", media_type: mt as "image/png" | "image/jpeg" | "image/webp" | "image/gif", data: file.base64 },
    };
  }
  if (mt.startsWith("text/") || mt === "application/json") {
    const text = Buffer.from(file.base64, "base64").toString("utf8").slice(0, 40000);
    return { type: "text", text: `Contenu du fichier « ${file.name} » :\n\n${text}` };
  }
  return null;
}

export async function runAssistant(messages: ChatMessage[], file?: AssistantFile): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante.");
  const anthropic = new Anthropic({ apiKey });

  const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));

  // Attache le fichier au dernier message utilisateur.
  if (file) {
    const block = fileBlock(file);
    for (let i = apiMessages.length - 1; i >= 0; i--) {
      if (apiMessages[i].role === "user") {
        const prompt = typeof apiMessages[i].content === "string" ? (apiMessages[i].content as string) : "";
        const content: Anthropic.ContentBlockParam[] = [];
        if (block) content.push(block);
        else content.push({ type: "text", text: `(Fichier « ${file.name} » joint — format non lisible directement, base-toi sur les indications.)` });
        content.push({ type: "text", text: prompt });
        apiMessages[i] = { role: "user", content };
        break;
      }
    }
  }

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1500,
    system: SYSTEM,
    messages: apiMessages,
  });

  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
