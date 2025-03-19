import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    LEGENDS_API_URL: process.env.LEGENDS_API_URL || 'https://api.smartlittlecookies.com/api'
  }
};

export default nextConfig;
