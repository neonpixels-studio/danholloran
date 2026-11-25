import { afterEach, describe, expect, it, vi } from "vitest";
import type { App } from "vue";

// A blocked or 404ing chunk makes the dynamic import itself reject.
vi.mock("@utils/errorReporting", () => {
  throw new Error("chunk failed to load");
});

import { startErrorReporting } from "@utils/startErrorReporting";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("startErrorReporting when the SDK chunk fails to load", () => {
  it("never rejects, so the page keeps working", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("SSR", false);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await expect(startErrorReporting({} as App)).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "Error reporting failed to start",
      expect.any(Error),
    );
  });
});
