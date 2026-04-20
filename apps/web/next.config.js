const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@nexus/shared-logic",
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

module.exports = withSentryConfig(nextConfig, {
  // Sentry project settings — set via CI env vars
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps when auth token is present (CI only)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress the Sentry CLI output in local dev
  silent: !process.env.CI,

  // Disable Sentry telemetry
  telemetry: false,

  // Keep the bundle smaller in dev
  disableLogger: true,

  // Automatically instrument server-side routes
  autoInstrumentServerFunctions: true,
});
