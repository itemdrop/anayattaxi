/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimized for Vercel deployment
  output: 'standalone',
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
  turbopack: {
    root: '/Users/efan/anayattaxi'
  },
  experimental: {
    optimizePackageImports: ['leaflet']
  }
};

export default nextConfig;