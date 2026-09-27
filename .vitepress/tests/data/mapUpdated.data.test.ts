import { describe, it, expect, vi, beforeEach } from "vitest";
import { join } from "path";

vi.mock("../../theme/utils/gitLastModified", () => ({
  gitLastModified: vi.fn(),
}));

import { gitLastModified } from "../../theme/utils/gitLastModified";
import mapUpdatedLoader from "../../data/mapUpdated.data";

const mockGitLastModified = vi.mocked(gitLastModified);

beforeEach(() => {
  vi.resetAllMocks();
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
});
