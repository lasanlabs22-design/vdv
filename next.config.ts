import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 85],
    // WebP only: AVIF encoding of the large renders stalled first loads for many seconds.
    formats: ["image/webp"],
  },
};

export default nextConfig;
