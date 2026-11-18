import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 85],
    // Capped at 1920: no source image is wider than 1600px, so larger widths were the same pixels cached again.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // WebP only: AVIF encoding of the large renders stalled first loads for many seconds.
    formats: ["image/webp"],
  },
};

export default nextConfig;
