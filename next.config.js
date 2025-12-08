/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimized for Vercel deployment
  output: 'standalone',
  images: {
    domains: ['tile.openstreetmap.org', 'nominatim.openstreetmap.org']
  },
  experimental: {
    optimizePackageImports: ['leaflet']
  }
};

export default nextConfig;