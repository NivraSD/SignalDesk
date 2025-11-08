import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  transpilePackages: ['lucide-react'],
  webpack: (config) => {
    config.optimization = {
      ...config.optimization,
      providedExports: false,
      usedExports: false,
    }
    return config
  },
};

export default nextConfig;
