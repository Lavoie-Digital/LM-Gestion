import type { MetadataRoute } from "next";

const SITE_URL = "https://lmgestionimmobiliere.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["", "/services", "/approche", "/portefeuille", "/contact"];
  const legal = ["/confidentialite", "/conditions"];
  return [
    ...routes.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...legal.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
