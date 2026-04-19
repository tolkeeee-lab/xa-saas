import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  async redirects() {
    return [
      { source: '/dashboard/transactions', destination: '/dashboard/ventes', permanent: true },
      { source: '/dashboard/personnel', destination: '/dashboard/equipe', permanent: true },
      { source: '/dashboard/employes', destination: '/dashboard/equipe', permanent: true },
    ];
  },
};

export default nextConfig;
