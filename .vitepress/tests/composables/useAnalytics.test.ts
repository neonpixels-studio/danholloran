import { describe, it, expect, vi, afterEach } from "vitest";
import { useAnalytics } from "../../theme/composables/useAnalytics";

const EVENT_NAME = "newsletter_subscribe";

function mockGtag() {
  const gtag = vi.fn();
  (globalThis as unknown as { gtag: typeof gtag }).gtag = gtag;
  return gtag;
}

function mockThrowingGtag() {
  const gtag = vi.fn(() => {
    throw new Error("gtag blew up");
  });
  (globalThis as unknown as { gtag: typeof gtag }).gtag = gtag;
  return gtag;
}

describe("useAnalytics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    delete (globalThis as unknown as { gtag?: unknown }).gtag;
  });

  it("no-ops during SSR when window is undefined", () => {
    const gtag = mockGtag();
    vi.stubGlobal("window", undefined);
    const { trackEvent } = useAnalytics();

    expect(() => trackEvent(EVENT_NAME)).not.toThrow();
    expect(gtag).not.toHaveBeenCalled();
  });

  it("no-ops when gtag is absent", () => {
    const { trackEvent } = useAnalytics();

    expect(() => trackEvent(EVENT_NAME)).not.toThrow();
  });

  it("no-ops when gtag is present but not a function", () => {
    (globalThis as unknown as { gtag: unknown }).gtag = "loaded";
    const { trackEvent } = useAnalytics();

    expect(() => trackEvent(EVENT_NAME)).not.toThrow();
  });

  it("forwards the event with an empty params default", () => {
    const gtag = mockGtag();
    const { trackEvent } = useAnalytics();

    trackEvent(EVENT_NAME);

    expect(gtag).toHaveBeenCalledWith("event", EVENT_NAME, {});
  });

  it("forwards custom params through to gtag", () => {
    const gtag = mockGtag();
    const { trackEvent } = useAnalytics();

    trackEvent(EVENT_NAME, { source: "banner" });

    expect(gtag).toHaveBeenCalledWith("event", EVENT_NAME, {
      source: "banner",
    });
  });

  it("swallows a throwing gtag and warns in dev", () => {
    vi.stubEnv("DEV", true);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockThrowingGtag();
    const { trackEvent } = useAnalytics();

    expect(() => trackEvent(EVENT_NAME)).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("swallows a throwing gtag silently outside dev", () => {
    vi.stubEnv("DEV", false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockThrowingGtag();
    const { trackEvent } = useAnalytics();

    expect(() => trackEvent(EVENT_NAME)).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
  });
});
