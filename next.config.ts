import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  /* turbopack rules removed - using official Tailwind v4 PostCSS config */
};

export default nextConfig;
