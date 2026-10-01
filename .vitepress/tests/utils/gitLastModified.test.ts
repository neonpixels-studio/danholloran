import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("child_process", () => {
  const execFileSync = vi.fn();
  return { default: { execFileSync }, execFileSync };
});

import { execFileSync } from "child_process";
import {
  gitLastModified,
  resetShallowRepositoryCache,
} from "../../theme/utils/gitLastModified";

const mockExecFileSync = vi.mocked(execFileSync);

beforeEach(() => {
  vi.resetAllMocks();
  resetShallowRepositoryCache();
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

  it("returns null instead of an Invalid Date for unparseable git output", () => {
    // Defensive: a well-formed `git log --format=%cI` never prints this, but
    // a caller (e.g. mapUpdated.data.ts) calls toISOString() on the result,
    // which throws a RangeError on an Invalid Date rather than degrading
    // gracefully — this must not reach that caller.
    mockExecFileSync.mockReturnValue("not-a-date\n" as any);

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

  describe("shallow clone guard", () => {
    const SHALLOW_ARGS = ["rev-parse", "--is-shallow-repository"];

    function mockGit(shallowOutput: string, logOutput: string) {
      mockExecFileSync.mockImplementation(((_cmd: string, args: string[]) =>
        args[0] === "rev-parse" ? shallowOutput : logOutput) as any);
    }

    it("returns null and warns without running git log on a shallow clone", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockGit("true\n", "2025-02-10T08:30:00.000Z\n");

      expect(gitLastModified("/repo/a.md")).toBeNull();

      expect(warn).toHaveBeenCalledOnce();
      expect(mockExecFileSync).not.toHaveBeenCalledWith(
        "git",
        expect.arrayContaining(["log"]),
        expect.anything(),
      );
      warn.mockRestore();
    });

    it("checks shallowness in the provided cwd", () => {
      mockGit("false\n", "2025-02-10T08:30:00.000Z\n");

      gitLastModified("a.md", "/custom/repo");

      expect(mockExecFileSync).toHaveBeenCalledWith("git", SHALLOW_ARGS, {
        cwd: "/custom/repo",
        encoding: "utf-8",
      });
    });

    it("returns the commit date on a full clone without warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockGit("false\n", "2025-02-10T08:30:00.000Z\n");

      expect(gitLastModified("/repo/a.md")).toEqual(
        new Date("2025-02-10T08:30:00.000Z"),
      );
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it("checks once per cwd and warns once across many files", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockGit("true\n", "");

      gitLastModified("/repo/a.md");
      gitLastModified("/repo/b.md");

      expect(warn).toHaveBeenCalledOnce();
      expect(mockExecFileSync).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });
  });
});
