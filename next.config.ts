import type { NextConfig } from "next";

const _isDev = process.env.NODE_ENV !== 'production';
const defaultApiBase = 'http://localhost:4000/api';
const defaultApiVersion = 'v3';

const nextConfig: NextConfig = {
  env: {
    // Prefer explicit env, otherwise default to localhost in dev and production API in prod
    LEGENDS_API_URL: process.env.LEGENDS_API_URL || defaultApiBase,
    LEGENDS_API_VERSION: process.env.LEGENDS_API_VERSION || defaultApiVersion
  }
};

export default nextConfig;
