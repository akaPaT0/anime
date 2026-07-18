import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      { protocol: 'https', hostname: 'img1.ak.crunchyroll.com' },
    ],
  },
  serverExternalPackages: ['@consumet/extensions', 'got-scraping'],
};

export default nextConfig;
