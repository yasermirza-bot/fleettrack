/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/prisma/seed.ts', '**/prisma/seed-direct.mjs'],
    };
    return config;
  },
};

module.exports = nextConfig;