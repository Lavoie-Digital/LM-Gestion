/* ------------------------------------------------------------------ *
 * Génération de PDF simple et de marque (pour les résumés de l'assistant).
 * pdf-lib (pur JS, compatible serveur). Police Helvetica (WinAnsi) → on
 * nettoie le texte pour éviter tout caractère non encodable.
 * ------------------------------------------------------------------ */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const INK = rgb(0.043, 0.043, 0.047);
const GRAY = rgb(0.33, 0.33, 0.35);

/** Nettoie le texte pour l'encodage WinAnsi (Helvetica). */
function clean(s: string): string {
  return s
    .replace(/ /g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/→/g, "->")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .replace(/[^\t\n\r\x20-\xFF]/g, "");
}

/** Retire le markdown léger et normalise les puces. */
function stripMd(line: string): string {
  return line
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/, "")
    .replace(/^\s*[-*]\s+/, "- ");
}

export async function summaryPdf(opts: { title: string; body: string; dateLabel: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 612;
  const H = 792;
  const M = 56;
  const maxW = W - M * 2;

  let page = doc.addPage([W, H]);
  let y = H;

  // En-tête de marque.
  page.drawRectangle({ x: 0, y: H - 84, width: W, height: 84, color: INK });
  page.drawText("LM GESTION IMMOBILIERE", { x: M, y: H - 40, size: 9, font: bold, color: rgb(0.96, 0.95, 0.94) });
  page.drawText(clean(opts.title), { x: M, y: H - 64, size: 15, font: bold, color: rgb(1, 1, 1) });
  y = H - 84 - 34;

  page.drawText(clean(opts.dateLabel), { x: M, y, size: 9, font, color: GRAY });
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.75, color: rgb(0.89, 0.88, 0.86) });
  y -= 22;

  const drawWrapped = (text: string, size: number, f: typeof font) => {
    const words = clean(text).split(/\s+/);
    let line = "";
    const flush = () => {
      if (!line) return;
      if (y < M) {
        page = doc.addPage([W, H]);
        y = H - M;
      }
      page.drawText(line, { x: M, y, size, font: f, color: INK });
      y -= size + 5;
      line = "";
    };
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(trial, size) > maxW) {
        flush();
        line = w;
      } else {
        line = trial;
      }
    }
    flush();
  };

  for (const raw of opts.body.split("\n")) {
    const line = stripMd(raw);
    if (!line.trim()) {
      y -= 8; // paragraphe vide
      continue;
    }
    drawWrapped(line, 11, font);
    y -= 3;
  }

  return doc.save();
}
