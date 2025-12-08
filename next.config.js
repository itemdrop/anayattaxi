/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimized for Vercel deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.tile.openstreetmap.org',
      },
      {
        protocol: 'https',
        hostname: 'nominatim.openstreetmap.org',
      },
      {
        protocol: 'https',
        hostname: 'cdnjs.cloudflare.com',
      }
    ]
  },
  experimental: {
    optimizePackageImports: ['leaflet']
  }
};

export default nextConfig;