import type { App } from "vue";

const DEFAULT_ENVIRONMENT = "development";
const IDLE_TIMEOUT_MS = 5000;

type IdleCallback = (_callback: () => void, _options: object) => void;

function runWhenIdle(callback: () => void) {
  const requestIdle = (window as { requestIdleCallback?: IdleCallback })
    .requestIdleCallback;
  if (!requestIdle) {
    setTimeout(callback, 0);
    return;
  }
  requestIdle.call(window, callback, { timeout: IDLE_TIMEOUT_MS });
}

// Resolves once the page has finished loading and the browser is idle, so the
// SDK never competes with first paint or hydration.
function whenPageInteractive(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === "complete") {
      runWhenIdle(resolve);
      return;
    }
    window.addEventListener("load", () => runWhenIdle(resolve), { once: true });
  });
}

// Baked in at build time by .vitepress/config.ts from Netlify's CONTEXT.
function bakedInEnvironment(): string {
  const environment: string | undefined = import.meta.env
    .VITE_SENTRY_ENVIRONMENT;
  return environment ?? DEFAULT_ENVIRONMENT;
}

async function loadAndInit(app: App) {
  // Error reporting must never take the page down with it: a blocked chunk or
  // a failed init leaves the page working, unreported.
  try {
    const { initErrorReporting } = await import("./errorReporting");
    initErrorReporting(app, {
      environment: bakedInEnvironment(),
    });
  } catch (error) {
    console.error("Error reporting failed to start", error);
  }
}

// Production browser builds only. The returned promise settles after the SDK
// has started or failed; callers must not await it before mounting the app.
export async function startErrorReporting(app: App): Promise<void> {
  if (import.meta.env.SSR || !import.meta.env.PROD) {
    return;
  }
  await whenPageInteractive();
  await loadAndInit(app);
}
