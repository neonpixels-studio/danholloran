import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "path";

vi.mock("../../theme/utils/gitLastModified", () => ({
  gitLastModified: vi.fn(),
}));

import { gitLastModified } from "../../theme/utils/gitLastModified";
import mapUpdatedLoader from "../../data/mapUpdated.data";

const mockGitLastModified = vi.mocked(gitLastModified);

// `load()` always warns for a null date (the common case in these tests,
// since most cases mock `gitLastModified` to return null), so the spy lives
// here rather than per-test — that also guarantees `mockRestore` runs even
// if an assertion in the test body throws.
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetAllMocks();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("mapUpdated.data.ts loader", () => {
  it("resolves both map images' git commit dates to ISO strings", () => {
    mockGitLastModified.mockImplementation((filePath) => {
      if (String(filePath).endsWith("visited-locations-light.png")) {
        return new Date("2025-01-01T00:00:00.000Z");
      }
      if (String(filePath).endsWith("visited-locations-dark.png")) {
        return new Date("2025-06-15T00:00:00.000Z");
      }
      return null;
    });

    const result = mapUpdatedLoader.load();

    expect(result).toEqual({
      light: "2025-01-01T00:00:00.000Z",
      dark: "2025-06-15T00:00:00.000Z",
    });
  });

  it("resolves against the public/images directory", () => {
    mockGitLastModified.mockReturnValue(null);

    mapUpdatedLoader.load();

    expect(mockGitLastModified).toHaveBeenCalledWith(
      join(process.cwd(), "public/images/visited-locations-light.png"),
    );
    expect(mockGitLastModified).toHaveBeenCalledWith(
      join(process.cwd(), "public/images/visited-locations-dark.png"),
    );
  });

  it("returns null for an image that is untracked or has no git history", () => {
    mockGitLastModified.mockReturnValue(null);

    expect(mapUpdatedLoader.load()).toEqual({ light: null, dark: null });
  });

  it("warns when an image resolves to no git history, so a broken build-time path is visible in logs", () => {
    mockGitLastModified.mockReturnValue(null);

    mapUpdatedLoader.load();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("visited-locations-light.png"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("visited-locations-dark.png"),
    );
  });
});
