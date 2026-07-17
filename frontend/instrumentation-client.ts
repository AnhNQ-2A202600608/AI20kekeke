import posthog from "posthog-js";

const isDev = process.env.NODE_ENV === "development";
const enableInDev = process.env.NEXT_PUBLIC_ENABLE_POSTHOG_IN_DEV === "true";
const disablePostHog = process.env.NEXT_PUBLIC_DISABLE_POSTHOG === "true";

if (typeof window !== "undefined" && !disablePostHog) {
  if (!isDev || enableInDev) {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2026-01-30",
        capture_exceptions: true,
        debug: isDev,
      });
    }
  }
}
