import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Demo imagery is sourced from Unsplash (rendered in grayscale to stay on-brand).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    qualities: [60, 75, 90],
  },
};

export default nextConfig;
