import { describe, it, expect, vi, afterEach } from "vitest";
import { withTimeoutSignal } from "../../theme/utils/timeoutSignal";

const TIMEOUT_MS = 10_000;

const throwingTimeout = {
  timeout: () => {
    throw new Error("boom");
  },
};

describe("withTimeoutSignal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("uses the native AbortSignal.timeout when it is available", () => {
    const nativeSignal = new AbortController().signal;
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(nativeSignal);

    const { signal } = withTimeoutSignal(TIMEOUT_MS);

    expect(timeoutSpy).toHaveBeenCalledWith(TIMEOUT_MS);
    expect(signal).toBe(nativeSignal);
  });

  it("aborts via the fallback timer exactly at the requested delay", () => {
    vi.useFakeTimers();
    vi.stubGlobal("AbortSignal", {});

    const { signal } = withTimeoutSignal(TIMEOUT_MS);

    expect(signal).toBeDefined();
    vi.advanceTimersByTime(TIMEOUT_MS - 1);
    expect(signal?.aborted).toBe(false);
    vi.advanceTimersByTime(1);
    expect(signal?.aborted).toBe(true);
  });

  it("clear() cancels the fallback timer so a settled request never aborts", () => {
    vi.useFakeTimers();
    vi.stubGlobal("AbortSignal", {});

    const { signal, clear } = withTimeoutSignal(TIMEOUT_MS);
    clear();
    vi.advanceTimersByTime(TIMEOUT_MS);

    expect(signal?.aborted).toBe(false);
  });

  it("falls back to a bounded signal when AbortSignal.timeout throws", () => {
    vi.useFakeTimers();
    vi.stubGlobal("AbortSignal", throwingTimeout);

    const { signal } = withTimeoutSignal(TIMEOUT_MS);

    expect(signal).toBeDefined();
    expect(signal?.aborted).toBe(false);
    vi.advanceTimersByTime(TIMEOUT_MS);
    expect(signal?.aborted).toBe(true);
  });

  it("stays unbounded when a throwing timeout is paired with no AbortController", () => {
    vi.stubGlobal("AbortSignal", throwingTimeout);
    vi.stubGlobal("AbortController", undefined);

    const { signal } = withTimeoutSignal(TIMEOUT_MS);

    expect(signal).toBeUndefined();
  });

  it("stays unbounded when neither AbortSignal.timeout nor AbortController exists", () => {
    vi.stubGlobal("AbortSignal", undefined);
    vi.stubGlobal("AbortController", undefined);

    const { signal } = withTimeoutSignal(TIMEOUT_MS);

    expect(signal).toBeUndefined();
  });
});
