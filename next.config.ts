import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    // Don't fail the build because of ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
