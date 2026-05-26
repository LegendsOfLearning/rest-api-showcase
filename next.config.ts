import type { NextConfig } from "next";

const defaultApiVersion = 'v3';

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    LEGENDS_API_VERSION: process.env.LEGENDS_API_VERSION || defaultApiVersion
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'releases-cdn.legendsoflearning.com',
      },
    ],
  },
};

export default nextConfig;
