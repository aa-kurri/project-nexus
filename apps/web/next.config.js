/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: [
    "@nexus/shared-logic",
    "@nexus/ai-orchestrator",
    "@nexus/sprint-engine",
  ],
  experimental: { 
    serverActions: { bodySizeLimit: "4mb" },
    serverComponentsExternalPackages: ["playwright", "playwright-core"]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
