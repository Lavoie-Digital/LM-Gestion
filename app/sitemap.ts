import type { MetadataRoute } from "next";

const SITE_URL = "https://lmgestionimmobiliere.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["", "/services", "/approche", "/portefeuille", "/contact"];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
