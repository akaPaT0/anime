import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      { protocol: 'https', hostname: 'img1.ak.crunchyroll.com' },
    ],
  },
  serverExternalPackages: ['@consumet/extensions', 'got-scraping'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; media-src 'self' blob: https:; connect-src 'self' https:; frame-src 'self' https:; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
