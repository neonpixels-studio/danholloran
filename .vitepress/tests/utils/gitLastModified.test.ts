import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("child_process", () => {
  const execFileSync = vi.fn();
  return { default: { execFileSync }, execFileSync };
});

import { execFileSync } from "child_process";
import {
  BULK_COMMIT_MARKDOWN_THRESHOLD,
  MAX_COMMITS_EXAMINED,
  gitLastModified,
  isBulkCommit,
  parseCommitLog,
  selectContentCommit,
  type FileCommit,
  isGitHistoryAvailable,
  resetGitCaches,
} from "../../theme/utils/gitLastModified";

const mockExecFileSync = vi.mocked(execFileSync);

beforeEach(() => {
  vi.resetAllMocks();
  resetGitCaches();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const LOG_FORMAT =
  "--format=%H%x1f%cI%x1f%(trailers:key=Skip-Modified,valueonly)%x1e";

function secondsAfterEpochStart(seconds: number): string {
  return new Date(Date.UTC(2025, 0, 1) + seconds * 1000).toISOString();
}

function logRecord(hash: string, isoDate: string, trailer = "") {
  return `${hash}\x1f${isoDate}\x1f${trailer}\x1e\n`;
}

function markdownFiles(count: number): string {
  return Array.from({ length: count }, (_, index) => `p${index}.md`).join("\0");
}

// Routes the three git subcommands the module uses. `touched` maps a commit
// hash to the number of markdown files that commit changed.
function mockGitHistory(
  log: string,
  touched: Record<string, number> = {},
  shallowOutput = "false\n",
) {
  mockExecFileSync.mockImplementation(((_cmd: string, args: string[]) => {
    if (args[0] === "rev-parse") {
      return shallowOutput;
    }
    if (args[0] === "log") {
      return log;
    }
    return markdownFiles(touched[args[args.indexOf("--") - 1]] ?? 1);
  }) as any);
}

describe("gitLastModified", () => {
  it("returns the commit date for a tracked file", () => {
    mockGitHistory(logRecord("aaa", "2025-02-10T08:30:00.000Z"));

    const result = gitLastModified("/repo/public/images/map.png");

    expect(result).toEqual(new Date("2025-02-10T08:30:00.000Z"));
    expect(mockExecFileSync).toHaveBeenCalledWith(
      "git",
      [
        "log",
        `--max-count=${MAX_COMMITS_EXAMINED + 1}`,
        "--no-merges",
        LOG_FORMAT,
        "--",
        "/repo/public/images/map.png",
      ],
      { cwd: process.cwd(), encoding: "utf-8" },
    );
  });

  it("skips a commit carrying the Skip-Modified trailer", () => {
    mockGitHistory(
      logRecord("new", "2025-03-01T00:00:00.000Z", "true") +
        logRecord("old", "2025-01-01T00:00:00.000Z"),
    );

    expect(gitLastModified("/repo/a.md")).toEqual(
      new Date("2025-01-01T00:00:00.000Z"),
    );
  });

  it("skips a bulk commit touching more markdown files than the threshold", () => {
    mockGitHistory(
      logRecord("sweep", "2025-03-01T00:00:00.000Z") +
        logRecord("edit", "2025-01-01T00:00:00.000Z"),
      { sweep: BULK_COMMIT_MARKDOWN_THRESHOLD + 1 },
    );

    expect(gitLastModified("/repo/a.md")).toEqual(
      new Date("2025-01-01T00:00:00.000Z"),
    );
  });

  it("keeps a commit touching exactly the threshold number of files", () => {
    mockGitHistory(logRecord("edit", "2025-03-01T00:00:00.000Z"), {
      edit: BULK_COMMIT_MARKDOWN_THRESHOLD,
    });

    expect(gitLastModified("/repo/a.md")).toEqual(
      new Date("2025-03-01T00:00:00.000Z"),
    );
  });

  it("falls back to the creation commit when every commit is bulk and history is complete", () => {
    mockGitHistory(
      logRecord("sweep", "2025-03-01T00:00:00.000Z") +
        logRecord("import", "2025-01-01T00:00:00.000Z"),
      {
        sweep: BULK_COMMIT_MARKDOWN_THRESHOLD + 5,
        import: BULK_COMMIT_MARKDOWN_THRESHOLD + 5,
      },
    );

    expect(gitLastModified("/repo/a.md")).toEqual(
      new Date("2025-01-01T00:00:00.000Z"),
    );
  });

  it("returns null when the examined window is all bulk and may not reach creation", () => {
    const log = Array.from({ length: MAX_COMMITS_EXAMINED + 1 }, (_, index) =>
      logRecord(`c${index}`, "2025-03-01T00:00:00.000Z", "true"),
    ).join("");
    mockGitHistory(log);

    expect(gitLastModified("/repo/a.md")).toBeNull();
  });

  it("does not skip a commit whose Skip-Modified trailer is false", () => {
    mockGitHistory(logRecord("edit", "2025-03-01T00:00:00.000Z", "false"));

    expect(gitLastModified("/repo/a.md")).toEqual(
      new Date("2025-03-01T00:00:00.000Z"),
    );
  });

  it("counts only markdown files when deciding a commit is bulk", () => {
    const pngs = Array.from(
      { length: BULK_COMMIT_MARKDOWN_THRESHOLD + 5 },
      (_, index) => `img${index}.png`,
    );
    mockExecFileSync.mockImplementation(((_cmd: string, args: string[]) => {
      if (args[0] === "rev-parse") {
        return "false\n";
      }
      if (args[0] === "log") {
        return logRecord("assets", "2025-03-01T00:00:00.000Z");
      }
      return [...pngs, "a.md"].join("\0");
    }) as any);

    expect(gitLastModified("/repo/a.md")).toEqual(
      new Date("2025-03-01T00:00:00.000Z"),
    );
  });

  it("treats a commit as normal and warns when diff-tree fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockExecFileSync.mockImplementation(((_cmd: string, args: string[]) => {
      if (args[0] === "rev-parse") {
        return "false\n";
      }
      if (args[0] === "log") {
        return logRecord("edit", "2025-03-01T00:00:00.000Z");
      }
      throw new Error("bad object");
    }) as any);

    expect(gitLastModified("/repo/a.md")).toEqual(
      new Date("2025-03-01T00:00:00.000Z"),
    );
    expect(warn).toHaveBeenCalledOnce();
  });

  it("skips a commit with repeated Skip-Modified trailers", () => {
    mockGitHistory(
      logRecord("new", "2025-03-01T00:00:00.000Z", "true\ntrue") +
        logRecord("old", "2025-01-01T00:00:00.000Z"),
    );

    expect(gitLastModified("/repo/a.md")).toEqual(
      new Date("2025-01-01T00:00:00.000Z"),
    );
  });

  it("keeps the creation fallback when history is exactly the window size", () => {
    const log = Array.from({ length: MAX_COMMITS_EXAMINED }, (_, index) =>
      logRecord(`c${index}`, secondsAfterEpochStart(index), "true"),
    ).join("");
    mockGitHistory(log);

    expect(gitLastModified("/repo/a.md")).toEqual(
      new Date(secondsAfterEpochStart(MAX_COMMITS_EXAMINED - 1)),
    );
  });

  it("counts a shared bulk commit once across files", () => {
    mockGitHistory(logRecord("sweep", "2025-03-01T00:00:00.000Z"), {
      sweep: BULK_COMMIT_MARKDOWN_THRESHOLD + 1,
    });

    gitLastModified("/repo/a.md");
    gitLastModified("/repo/b.md");

    const diffTrees = mockExecFileSync.mock.calls.filter(
      ([, args]) => (args as string[])[0] === "diff-tree",
    );
    expect(diffTrees).toHaveLength(1);
  });

  it("returns null for an untracked file (empty git log output)", () => {
    mockGitHistory("");

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
    mockGitHistory(logRecord("aaa", "not-a-date"));

    expect(gitLastModified("/repo/public/images/map.png")).toBeNull();
  });

  it("runs git in the provided cwd instead of process.cwd() when given", () => {
    mockGitHistory(logRecord("aaa", "2025-02-10T08:30:00.000Z"));

    gitLastModified("public/images/map.png", "/custom/repo");

    expect(mockExecFileSync).toHaveBeenCalledWith(
      "git",
      expect.arrayContaining(["log", "--", "public/images/map.png"]),
      { cwd: "/custom/repo", encoding: "utf-8" },
    );
    expect(mockExecFileSync).toHaveBeenCalledWith(
      "git",
      expect.arrayContaining(["diff-tree", "aaa", "*.md"]),
      expect.objectContaining({ cwd: "/custom/repo", encoding: "utf-8" }),
    );
  });

  describe("shallow clone guard", () => {
    const SHALLOW_ARGS = ["rev-parse", "--is-shallow-repository"];

    function mockGit(shallowOutput: string, logOutput: string) {
      mockGitHistory(logOutput, {}, shallowOutput);
    }

    it("returns null and warns without running git log on a shallow clone", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockGit("true\n", logRecord("aaa", "2025-02-10T08:30:00.000Z"));

      expect(gitLastModified("/repo/a.md")).toBeNull();

      expect(warn).toHaveBeenCalledOnce();
      expect(mockExecFileSync).not.toHaveBeenCalledWith(
        "git",
        expect.arrayContaining(["log"]),
        expect.anything(),
      );
    });

    it("checks shallowness in the provided cwd", () => {
      mockGit("false\n", logRecord("aaa", "2025-02-10T08:30:00.000Z"));

      gitLastModified("a.md", "/custom/repo");

      expect(mockExecFileSync).toHaveBeenCalledWith("git", SHALLOW_ARGS, {
        cwd: "/custom/repo",
        encoding: "utf-8",
      });
    });

    it("returns the commit date on a full clone without warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockGit("false\n", logRecord("aaa", "2025-02-10T08:30:00.000Z"));

      expect(gitLastModified("/repo/a.md")).toEqual(
        new Date("2025-02-10T08:30:00.000Z"),
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it("returns null without running git log when the shallow check throws, and caches it", () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error("not a git repository");
      });

      expect(gitLastModified("/repo/a.md")).toBeNull();
      expect(gitLastModified("/repo/b.md")).toBeNull();

      expect(mockExecFileSync).toHaveBeenCalledTimes(1);
    });

    it("treats unrecognized rev-parse output (git < 2.15) as not shallow", () => {
      mockGit(
        "--is-shallow-repository\n",
        logRecord("aaa", "2025-02-10T08:30:00.000Z"),
      );

      expect(gitLastModified("/repo/a.md")).toEqual(
        new Date("2025-02-10T08:30:00.000Z"),
      );
    });

    it("checks each cwd separately", () => {
      mockGit("false\n", logRecord("aaa", "2025-02-10T08:30:00.000Z"));

      gitLastModified("a.md", "/repo-one");
      gitLastModified("a.md", "/repo-two");

      const shallowChecks = mockExecFileSync.mock.calls.filter(
        ([, args]) => (args as string[])[0] === "rev-parse",
      );
      expect(shallowChecks).toHaveLength(2);
    });

    it("checks once per cwd and warns once across many files", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockGit("true\n", "");

      gitLastModified("/repo/a.md");
      gitLastModified("/repo/b.md");

      expect(warn).toHaveBeenCalledOnce();
      expect(mockExecFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe("isGitHistoryAvailable", () => {
    function mockRevParse(output: string) {
      mockExecFileSync.mockReturnValue(output as any);
    }

    it("is false on a shallow clone", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockRevParse("true\n");
      expect(isGitHistoryAvailable("/repo")).toBe(false);
      expect(isGitHistoryAvailable("/repo")).toBe(false);
      expect(warn).toHaveBeenCalledOnce();
    });

    it("is false when git cannot answer", () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error("not a git repository");
      });
      expect(isGitHistoryAvailable("/repo")).toBe(false);
    });

    it("is true on a full clone", () => {
      mockRevParse("false\n");
      expect(isGitHistoryAvailable("/repo")).toBe(true);
    });
  });
});

describe("parseCommitLog", () => {
  it("parses hash, date and trailer presence per record", () => {
    const commits = parseCommitLog(
      logRecord("a1", "2025-01-02T00:00:00Z", "true") +
        logRecord("b2", "2025-01-01T00:00:00Z"),
    );

    expect(commits).toEqual([
      { hash: "a1", isoDate: "2025-01-02T00:00:00Z", hasSkipTrailer: true },
      { hash: "b2", isoDate: "2025-01-01T00:00:00Z", hasSkipTrailer: false },
    ]);
  });

  it("returns an empty list for empty output", () => {
    expect(parseCommitLog("")).toEqual([]);
  });
});

describe("isBulkCommit", () => {
  it("is true only above the threshold", () => {
    expect(isBulkCommit(BULK_COMMIT_MARKDOWN_THRESHOLD)).toBe(false);
    expect(isBulkCommit(BULK_COMMIT_MARKDOWN_THRESHOLD + 1)).toBe(true);
  });
});

describe("selectContentCommit", () => {
  const commit = (hash: string, hasSkipTrailer = false): FileCommit => ({
    hash,
    isoDate: "2025-01-01T00:00:00Z",
    hasSkipTrailer,
  });

  it("returns the newest commit that is not skipped", () => {
    const counts: Record<string, number> = { b: 99, c: 1 };
    const selected = selectContentCommit(
      [commit("a", true), commit("b"), commit("c")],
      (hash) => counts[hash],
    );

    expect(selected?.hash).toBe("c");
  });

  it("does not count files for trailer-skipped commits", () => {
    const countFiles = vi.fn(() => 1);

    selectContentCommit([commit("a", true), commit("b")], countFiles);

    expect(countFiles).toHaveBeenCalledTimes(1);
    expect(countFiles).toHaveBeenCalledWith("b");
  });

  it("returns null for no commits", () => {
    expect(selectContentCommit([], () => 1)).toBeNull();
  });
});
