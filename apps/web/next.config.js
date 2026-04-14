/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: [
    "@nexus/shared-logic",
    "@nexus/crawler-engine",
    "@nexus/ai-orchestrator",
    "@nexus/sprint-engine",
  ],
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
