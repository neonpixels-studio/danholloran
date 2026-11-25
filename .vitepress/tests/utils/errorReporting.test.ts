import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, h } from "vue";
import { close, getClient } from "@sentry/vue";

const scrubEventSpy = vi.hoisted(() => vi.fn());
const allowUrlsForSpy = vi.hoisted(() => vi.fn());

vi.mock("@neon-pixels/sentry", async (importOriginal) => {
  const original = await importOriginal<typeof import("@neon-pixels/sentry")>();
  scrubEventSpy.mockImplementation(original.scrubEvent);
  // Test stack frames are file paths, which the real allowUrls would drop
  // before beforeSend; the call is asserted below instead.
  allowUrlsForSpy.mockReturnValue([/./]);
  return {
    ...original,
    scrubEvent: scrubEventSpy,
    allowUrlsFor: allowUrlsForSpy,
  };
});

import { SENTRY_DSN, initErrorReporting } from "@utils/errorReporting";

// Network stub: nothing leaves the test, every send reports success.
const stubTransport = () => ({
  send: async () => ({}),
  flush: async () => true,
});

const FAULTY_COMPONENT = defineComponent({
  setup() {
    throw new Error("component exploded");
  },
  render: () => h("div"),
});

function startReporting(app = createApp({ render: () => h("div") })) {
  initErrorReporting(app, {
    environment: "preview",
    transport: stubTransport,
  });
  return app;
}

function dispatchUnhandledRejection(reason: Error) {
  const event = new Event("unhandledrejection");
  Object.assign(event, { reason, promise: Promise.resolve() });
  globalThis.dispatchEvent(event);
}

async function waitForBeforeSend(message: string) {
  await vi.waitFor(() => {
    const messages = scrubEventSpy.mock.calls.map(([event]) =>
      JSON.stringify(event.exception ?? event),
    );
    expect(messages.some((text) => text.includes(message))).toBe(true);
  });
}

afterEach(async () => {
  await close();
  scrubEventSpy.mockClear();
  vi.restoreAllMocks();
});

describe("initErrorReporting", () => {
  it("configures the SDK from the shared filter lists and the site origin", () => {
    startReporting();
    const options = getClient()?.getOptions();
    expect(options?.dsn).toBe(SENTRY_DSN);
    expect(options?.environment).toBe("preview");
    expect(allowUrlsForSpy).toHaveBeenCalledWith(["https://danholloran.me"]);
    expect(options?.ignoreErrors?.length).toBeGreaterThan(0);
    expect(options?.denyUrls?.length).toBeGreaterThan(0);
  });

  it("turns off tracing, replay, and session tracking", () => {
    startReporting();
    const client = getClient();
    const integrationNames = client
      ?.getOptions()
      .integrations.map((integration) => integration.name);
    expect(integrationNames).not.toContain("BrowserSession");
    expect(integrationNames).not.toContain("BrowserTracing");
    expect(integrationNames).not.toContain("Replay");
    expect(client?.getOptions().tracesSampleRate).toBeUndefined();
  });

  it("sends neither user info nor cookies", () => {
    startReporting();
    expect(getClient()?.getOptions().dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
    });
  });

  it("passes an error thrown in a component through beforeSend", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Sentry's Vue error handler rethrows (like Vue's default), after
    // queueing the capture.
    const app = startReporting(createApp(FAULTY_COMPONENT));
    expect(() => app.mount(document.createElement("div"))).toThrow(
      "component exploded",
    );
    await waitForBeforeSend("component exploded");
  });

  it("reports component errors when started after the app has mounted", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const app = createApp({ render: () => h("div") });
    app.mount(document.createElement("div"));
    startReporting(app);
    const lateError = new Error("late component error");
    expect(() => app.config.errorHandler?.(lateError, null, "test")).toThrow(
      "late component error",
    );
    await waitForBeforeSend("late component error");
  });

  it("passes an unhandled promise rejection through beforeSend", async () => {
    startReporting();
    dispatchUnhandledRejection(new Error("rejected promise"));
    await waitForBeforeSend("rejected promise");
  });
});
