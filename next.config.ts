import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compiler: {
    styledComponents: true,
  },
  images: {
    remotePatterns: [{ hostname: "cards.scryfall.io" }],
  },
};

export default nextConfig;
