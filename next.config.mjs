/**
 * Next.js Configuration for CodeForge Runner.
 * Configures external server packages for MongoDB and Mongoose,
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
  },
};

export default nextConfig;
