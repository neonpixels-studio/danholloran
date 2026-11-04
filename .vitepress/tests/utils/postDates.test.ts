import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../theme/utils/gitLastModified", () => ({
  gitLastModified: vi.fn(),
}));

import { gitLastModified } from "../../theme/utils/gitLastModified";
import { resolvePostDates } from "../../theme/utils/postDates";

const mockGitLastModified = vi.mocked(gitLastModified);

beforeEach(() => {
  vi.clearAllMocks();
  mockGitLastModified.mockReturnValue(null);
});

describe("resolvePostDates", () => {
  it("returns null without a usable publish date", () => {
    expect(resolvePostDates({}, "a")).toBeNull();
    expect(resolvePostDates({ date: "not a date" }, "a")).toBeNull();
  });

  it("prefers frontmatter dateModified over git", () => {
    mockGitLastModified.mockReturnValue(new Date("2024-09-10T00:00:00.000Z"));

    expect(
      resolvePostDates({ date: "2024-03-01", dateModified: "2024-06-15" }, "a"),
    ).toEqual({ published: "2024-03-01", modified: "2024-06-15" });
  });

  it("uses the git date when frontmatter has no dateModified", () => {
    mockGitLastModified.mockReturnValue(new Date("2024-09-10T00:00:00.000Z"));

    expect(resolvePostDates({ date: "2024-03-01" }, "a")).toEqual({
      published: "2024-03-01",
      modified: "2024-09-10T00:00:00.000Z",
    });
  });

  it("falls back to the publish date when git is unavailable (shallow clone)", () => {
    expect(resolvePostDates({ date: "2024-03-01" }, "a")).toEqual({
      published: "2024-03-01",
      modified: "2024-03-01",
    });
  });

  it("never returns a modified date earlier than the publish date", () => {
    mockGitLastModified.mockReturnValue(new Date("2023-01-01T00:00:00.000Z"));

    expect(resolvePostDates({ date: "2024-03-01" }, "a")?.modified).toBe(
      "2024-03-01",
    );
  });

  it("normalizes YAML Date objects to ISO strings", () => {
    expect(
      resolvePostDates({ date: new Date("2024-03-01T00:00:00.000Z") }, "a"),
    ).toEqual({
      published: "2024-03-01T00:00:00.000Z",
      modified: "2024-03-01T00:00:00.000Z",
    });
  });
});
