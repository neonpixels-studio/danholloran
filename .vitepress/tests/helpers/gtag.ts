import { vi } from "vitest";

// Shared across every test that exercises trackEvent (useAnalytics itself,
// plus each composable that calls it — useNewsletter, useContact). Installs a
// global `gtag` the way the real GA script would, and hands back the spy so
// tests can assert on calls.
export function mockGtag() {
  const gtag = vi.fn();
  (globalThis as unknown as { gtag: typeof gtag }).gtag = gtag;
  return gtag;
}

export function mockThrowingGtag() {
  const gtag = vi.fn(() => {
    throw new Error("gtag blew up");
  });
  (globalThis as unknown as { gtag: typeof gtag }).gtag = gtag;
  return gtag;
}

// Call from `afterEach` alongside `vi.restoreAllMocks()` so a global `gtag`
// installed by one test never leaks into the next.
export function clearGtag() {
  delete (globalThis as unknown as { gtag?: unknown }).gtag;
}
