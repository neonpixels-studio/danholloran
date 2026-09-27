import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("child_process", () => {
  const execFileSync = vi.fn();
  return { default: { execFileSync }, execFileSync };
});

import { execFileSync } from "child_process";
import { gitLastModified } from "../../theme/utils/gitLastModified";

const mockExecFileSync = vi.mocked(execFileSync);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("gitLastModified", () => {
  it("returns the commit date for a tracked file", () => {
    mockExecFileSync.mockReturnValue("2025-02-10T08:30:00.000Z\n" as any);

    const result = gitLastModified("/repo/public/images/map.png");

    expect(result).toEqual(new Date("2025-02-10T08:30:00.000Z"));
    expect(mockExecFileSync).toHaveBeenCalledWith(
      "git",
      ["log", "-1", "--format=%cI", "--", "/repo/public/images/map.png"],
      { cwd: process.cwd(), encoding: "utf-8" },
    );
  });

  it("returns null for an untracked file (empty git log output)", () => {
    mockExecFileSync.mockReturnValue("" as any);

    expect(gitLastModified("/repo/public/images/untracked.png")).toBeNull();
  });

  it("returns null when git isn't available or the command fails", () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error("git: command not found");
    });

    expect(gitLastModified("/repo/public/images/map.png")).toBeNull();
  });

  it("runs git in the provided cwd instead of process.cwd() when given", () => {
    mockExecFileSync.mockReturnValue("2025-02-10T08:30:00.000Z\n" as any);

    gitLastModified("public/images/map.png", "/custom/repo");

    expect(mockExecFileSync).toHaveBeenCalledWith(
      "git",
      ["log", "-1", "--format=%cI", "--", "public/images/map.png"],
      { cwd: "/custom/repo", encoding: "utf-8" },
    );
  });
});
