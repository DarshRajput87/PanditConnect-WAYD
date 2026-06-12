/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // cache optimized images for 24h
    deviceSizes: [375, 640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
  },
  experimental: {
    // Tree-shake barrel imports so only the icons actually used are bundled.
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
