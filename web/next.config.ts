import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vinext inspects multipart requests before dispatching route handlers.
  // Individual capture and backup handlers still enforce their tighter limits.
  experimental: { serverActions: { bodySizeLimit: '32mb' } },
};

export default nextConfig;
