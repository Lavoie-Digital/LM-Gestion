import type { MetadataRoute } from "next";

const SITE_URL = "https://lmgestionimmobiliere.ca";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Espace client + routes techniques : non indexés.
        disallow: ["/api/", "/tableau-de-bord", "/connexion", "/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
