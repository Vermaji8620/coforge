/**
 * Next.js Configuration for CodeForge Runner.
 * Configures external server packages for MongoDB and Mongoose on Vercel,
 * alongside remote image whitelist patterns.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["mongoose", "mongodb-memory-server"],
  },
  images: {
    domains: ["images.unsplash.com", "api.dicebear.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
