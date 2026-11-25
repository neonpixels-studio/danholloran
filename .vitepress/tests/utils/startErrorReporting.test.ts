import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "vue";

const initErrorReporting = vi.hoisted(() => vi.fn());

vi.mock("@utils/errorReporting", () => ({ initErrorReporting }));

import { startErrorReporting } from "@utils/startErrorReporting";

const app = {} as App;

function setReadyState(state: Document["readyState"]) {
  vi.spyOn(document, "readyState", "get").mockReturnValue(state);
}

beforeEach(() => {
  initErrorReporting.mockReset();
  vi.stubEnv("PROD", true);
  vi.stubEnv("SSR", false);
  vi.stubEnv("VITE_SENTRY_ENVIRONMENT", "preview");
  setReadyState("complete");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("startErrorReporting", () => {
  it("starts the SDK with the baked-in environment once the page is loaded", async () => {
    await startErrorReporting(app);
    expect(initErrorReporting).toHaveBeenCalledOnce();
    expect(initErrorReporting).toHaveBeenCalledWith(app, {
      environment: "preview",
    });
  });

  it("waits for the load event while the page is still loading", async () => {
    setReadyState("loading");
    const started = startErrorReporting(app);
    await Promise.resolve();
    expect(initErrorReporting).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("load"));
    await started;
    expect(initErrorReporting).toHaveBeenCalledOnce();
  });

  it("waits for the browser to be idle when it can", async () => {
    let runIdleCallback = () => {};
    const requestIdleCallback = vi.fn((callback: () => void) => {
      runIdleCallback = callback;
    });
    vi.stubGlobal("requestIdleCallback", requestIdleCallback);
    window.requestIdleCallback =
      requestIdleCallback as unknown as typeof window.requestIdleCallback;
    const started = startErrorReporting(app);
    await Promise.resolve();
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 5000,
    });
    expect(initErrorReporting).not.toHaveBeenCalled();
    runIdleCallback();
    await started;
    expect(initErrorReporting).toHaveBeenCalledOnce();
    Reflect.deleteProperty(window, "requestIdleCallback");
  });

  it("does nothing outside a production build", async () => {
    vi.stubEnv("PROD", false);
    await startErrorReporting(app);
    expect(initErrorReporting).not.toHaveBeenCalled();
  });

  it("does nothing during server rendering", async () => {
    vi.stubEnv("SSR", true);
    await startErrorReporting(app);
    expect(initErrorReporting).not.toHaveBeenCalled();
  });

  it("falls back to the development environment when none was baked in", async () => {
    vi.stubEnv("VITE_SENTRY_ENVIRONMENT", undefined);
    await startErrorReporting(app);
    expect(initErrorReporting).toHaveBeenCalledWith(app, {
      environment: "development",
    });
  });

  it("logs and carries on when the SDK fails to start", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    initErrorReporting.mockImplementation(() => {
      throw new Error("init failed");
    });
    await expect(startErrorReporting(app)).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "Error reporting failed to start",
      expect.any(Error),
    );
  });
});
