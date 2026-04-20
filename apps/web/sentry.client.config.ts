import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100 % of transactions in dev, 10 % in prod
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay 10 % of sessions, 100 % on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  // Tag every event with tenant + role from the JWT claim stored in localStorage
  beforeSend(event) {
    try {
      const raw = localStorage.getItem("tenant-ctx");
      if (raw) {
        const ctx = JSON.parse(raw);
        event.tags = {
          ...event.tags,
          tenant_id: ctx.tenant_id ?? "unknown",
          user_role: ctx.role ?? "unknown",
        };
      }
    } catch {
      // ignore
    }
    return event;
  },
});
