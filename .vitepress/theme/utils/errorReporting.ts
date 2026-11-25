import { init, type getDefaultIntegrations } from "@sentry/vue";
import {
  DENIED_URLS,
  IGNORED_ERRORS,
  allowUrlsFor,
  scrubEvent,
} from "@neon-pixels/sentry";
import type { App } from "vue";
import { SITE_URL } from "./constants";

// v11 no longer re-exports the Integration type from @sentry/vue.
type Integration = ReturnType<typeof getDefaultIntegrations>[number];
type SentryTransport = NonNullable<Parameters<typeof init>[0]>["transport"];

// A public value: it can only send events to this project.
export const SENTRY_DSN =
  "https://5fa6bc96ff1269ced10b58f45f848fa6@o4511543514497024.ingest.us.sentry.io/4512493571735552";
// Release-health sessions send one request to Sentry on every page load, error
// or not. Dropped so a visitor who hits no error sends Sentry nothing.
const SESSION_INTEGRATION_NAME = "BrowserSession";

function withoutSessionTracking(integrations: Integration[]) {
  return integrations.filter(
    (integration) => integration.name !== SESSION_INTEGRATION_NAME,
  );
}

type ErrorReportingOptions = {
  environment: string;
  // Lets tests swap the network for a stub.
  transport?: SentryTransport;
};

// Loaded only through a dynamic import (see startErrorReporting.ts), so the SDK
// stays out of the entry bundle.
export function initErrorReporting(
  app: App,
  { environment, transport }: ErrorReportingOptions,
) {
  init({
    app,
    dsn: SENTRY_DSN,
    environment,
    ...(transport ? { transport } : {}),
    // Errors only: no tracing, session replay or session tracking.
    integrations: withoutSessionTracking,
    ignoreErrors: [...IGNORED_ERRORS],
    denyUrls: [...DENIED_URLS],
    allowUrls: allowUrlsFor([SITE_URL]),
    beforeSend: scrubEvent,
    // v11 defaults collect user info (Sentry infers the visitor's IP from it)
    // and cookies (GA's _ga ids), so both are turned off.
    dataCollection: { userInfo: false, cookies: false },
  });
}
