type GtagFn = (
  _command: "event",
  _eventName: string,
  _eventParams?: Record<string, unknown>,
) => void;

// Analytics is best-effort: never let a gtag failure surface to callers.
function warnInDev(eventName: string, error: unknown) {
  if (!import.meta.env.DEV) {
    return;
  }
  console.warn(`gtag event "${eventName}" failed`, error);
}

/**
 * Thin wrapper over the globally-loaded gtag (see config.ts head scripts).
 * No-ops during SSR or when the GA script is blocked, so callers never guard.
 */
export function useAnalytics() {
  function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
    if (typeof window === "undefined") {
      return;
    }
    const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
    if (typeof gtag !== "function") {
      return;
    }
    try {
      gtag("event", eventName, params);
    } catch (error) {
      warnInDev(eventName, error);
    }
  }

  return { trackEvent };
}
