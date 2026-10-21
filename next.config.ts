import type { NextConfig } from "next";

/**
 * En-têtes de sécurité HTTP appliqués à toutes les réponses.
 * Volontairement sans CSP stricte sur les scripts (Firebase Auth, popups Google
 * et scripts inline de Next en auraient besoin) — on verrouille ce qui ne
 * casse rien : HTTPS forcé, anti-iframe (clickjacking), anti-sniffing MIME,
 * référent minimal, API navigateur sensibles désactivées.
 */
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Demo imagery is sourced from Unsplash (rendered in grayscale to stay on-brand).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    qualities: [60, 75, 90],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
