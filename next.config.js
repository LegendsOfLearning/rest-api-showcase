/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel will automatically pick up environment variables with NEXT_PUBLIC_ prefix
  // for client-side code, and all environment variables for server-side code
  
  // Configure allowed image domains using remotePatterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'releases-cdn.legendsoflearning.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '**',
      }
    ],
  }
}

module.exports = nextConfig 