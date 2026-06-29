import { ImageResponse } from "next/og";

export const alt = "LM Gestion Immobilière — Gestion immobilière au Saguenay–Lac-Saint-Jean";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Image de partage social (1200×630) générée aux couleurs de la marque.
 * Utilisée par Facebook, LinkedIn, iMessage/SMS, WhatsApp, X, etc.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0c",
          padding: "72px 80px",
          color: "#f4f3f0",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            color: "#a0a0a6",
            fontFamily: "Arial, sans-serif",
          }}
        >
          MAISON DE GESTION PRIVÉE
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 600, lineHeight: 1.05 }}>
            LM Gestion Immobilière
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 34, color: "#c6c4bd", maxWidth: 940 }}>
            Votre patrimoine mérite une gestion d’exception.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 4, width: 120, background: "#c6c4bd", marginBottom: 22 }} />
          <div style={{ display: "flex", fontSize: 23, color: "#a0a0a6", fontFamily: "Arial, sans-serif" }}>
            Saguenay–Lac-Saint-Jean · Chicoutimi · Jonquière · La Baie · Alma
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
