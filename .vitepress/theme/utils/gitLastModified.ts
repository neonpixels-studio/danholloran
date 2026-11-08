import { execFileSync } from "child_process";

// Per-cwd cache: sitemap generation calls gitLastModified per page, and the
// answer can't change mid-build. Also keeps the warning to a single line.
const gitDatesUsableByCwd = new Map<string, boolean>();
// Shared across files: a sweep commit touching N posts is diffed once, not N times.
const markdownCountByCommit = new Map<string, number>();

function readShallowFlag(cwd: string): string | null {
  try {
    return execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
      cwd,
      encoding: "utf-8",
    }).trim();
  } catch {
    return null;
  }
}

function warnShallow(): void {
  console.warn(
    "gitLastModified: shallow git clone detected; commit dates are unreliable, so returning null. Use fetch-depth: 0 for accurate lastmod dates.",
  );
}

// False when git can't answer (missing, not a repo) or the clone is shallow.
function canUseGitDates(cwd: string): boolean {
  const cached = gitDatesUsableByCwd.get(cwd);
  if (cached !== undefined) {
    return cached;
  }
  const output = readShallowFlag(cwd);
  const usable = output !== null && output !== "true";
  if (output === "true") {
    warnShallow();
  }
  gitDatesUsableByCwd.set(cwd, usable);
  return usable;
}

// Lets callers tell "untracked file" (null from gitLastModified, history is
// fine) apart from "history unavailable" (shallow clone, no git), so they can
// omit a date instead of substituting a misleading mtime.
export function isGitHistoryAvailable(cwd: string = process.cwd()): boolean {
  return canUseGitDates(cwd);
}

export function resetGitCaches(): void {
  gitDatesUsableByCwd.clear();
  markdownCountByCommit.clear();
}

// Bulk/mechanical commits (Prettier sweeps, frontmatter migrations,
// description trims) must not count as content edits. A commit is skipped when
// it carries the skip trailer, or when it touches more markdown files than the
// threshold.
export const SKIP_MODIFIED_TRAILER = "Skip-Modified";
const SKIP_TRAILER_VALUE = "true";
const DIFF_TREE_MAX_BUFFER_BYTES = 64 * 1024 * 1024;
export const BULK_COMMIT_MARKDOWN_THRESHOLD = 20;
// Per-file window of commits examined (one extra is read to detect that the
// history was truncated). If all examined commits are skipped and the window
// covers the whole history, the creation commit is used so a post born in a
// bulk commit keeps a date; otherwise null (date unknown).
export const MAX_COMMITS_EXAMINED = 50;

const FIELD_SEPARATOR = "\x1f";
const RECORD_SEPARATOR = "\x1e";

export interface FileCommit {
  hash: string;
  isoDate: string;
  hasSkipTrailer: boolean;
}

function hasSkipValue(trailerOutput: string): boolean {
  return trailerOutput
    .split("\n")
    .some((value) => value.trim().toLowerCase() === SKIP_TRAILER_VALUE);
}

// Parses `git log --format=%H<US>%cI<US>%(trailers:...)<RS>` output.
export function parseCommitLog(output: string): FileCommit[] {
  return output
    .split(RECORD_SEPARATOR)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash = "", isoDate = "", trailer = ""] =
        record.split(FIELD_SEPARATOR);
      return {
        hash,
        isoDate,
        hasSkipTrailer: hasSkipValue(trailer),
      };
    });
}

export function isBulkCommit(markdownFilesTouched: number): boolean {
  return markdownFilesTouched > BULK_COMMIT_MARKDOWN_THRESHOLD;
}

// eslint-disable-next-line no-unused-vars
type MarkdownFileCounter = (commitHash: string) => number;

// Pure selection: the newest commit that is neither trailer-marked nor bulk.
// `countMarkdownFiles` is only consulted for commits not already skipped.
export function selectContentCommit(
  commits: FileCommit[],
  countMarkdownFiles: MarkdownFileCounter,
): FileCommit | null {
  const isContentCommit = (commit: FileCommit) =>
    !commit.hasSkipTrailer && !isBulkCommit(countMarkdownFiles(commit.hash));
  return (
    commits.find(isContentCommit) ?? creationCommitWhenHistoryComplete(commits)
  );
}

function creationCommitWhenHistoryComplete(
  commits: FileCommit[],
): FileCommit | null {
  if (commits.length === 0 || commits.length > MAX_COMMITS_EXAMINED) {
    return null;
  }
  return commits[commits.length - 1];
}

function readFileCommits(filePath: string, cwd: string): FileCommit[] {
  const output = execFileSync(
    "git",
    [
      "log",
      `--max-count=${MAX_COMMITS_EXAMINED + 1}`,
      "--no-merges",
      `--format=%H%x1f%cI%x1f%(trailers:key=${SKIP_MODIFIED_TRAILER},valueonly)%x1e`,
      "--",
      filePath,
    ],
    { cwd, encoding: "utf-8" },
  );
  return parseCommitLog(output);
}

// A failed diff must not null out the date (callers would fall back to mtime),
// so it is treated as "not bulk" and reported.
function countMarkdownFilesInCommit(hash: string, cwd: string): number {
  try {
    return cachedMarkdownCount(hash, cwd);
  } catch {
    markdownCountByCommit.set(`${cwd}\0${hash}`, 0);
    console.warn(
      `gitLastModified: could not diff commit ${hash}; treating it as a normal commit.`,
    );
    return 0;
  }
}

function cachedMarkdownCount(hash: string, cwd: string): number {
  const cacheKey = `${cwd}\0${hash}`;
  const cached = markdownCountByCommit.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  // -z avoids git quoting non-ASCII paths, which would hide their .md suffix.
  const output = execFileSync(
    "git",
    [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      "-z",
      "--root",
      hash,
      "--",
      "*.md",
    ],
    { cwd, encoding: "utf-8", maxBuffer: DIFF_TREE_MAX_BUFFER_BYTES },
  );
  const count = output
    .split("\0")
    .filter((line) => line.endsWith(".md")).length;
  markdownCountByCommit.set(cacheKey, count);
  return count;
}

// The real last-content-change date for a file: the committer date of its
// most recent non-bulk commit (`%cI`, matching sitemap.ts's existing choice).
// The committer date is when a commit actually landed in this branch's history -
// a rebase or squash resets it while preserving the original author date, so
// it's the more accurate "how fresh is this history" signal for a build
// that's about to publish that history. File mtime and HTTP `Last-Modified`
// headers are unreliable freshness signals - on a fresh CI clone/build, both
// degrade to checkout (build) time, signalling false freshness on every
// deploy regardless of whether the underlying content actually changed.
// Bulk commits (git >= 2.22 for the trailer format; see BULK_COMMIT_MARKDOWN_THRESHOLD and SKIP_MODIFIED_TRAILER)
// are ignored. Returns null for an untracked file, when every examined commit
// is bulk, unparseable git output, when git isn't available, or on a shallow
// clone (where `git log` reports the single fetched commit for every file), so
// the caller can fall back to mtime (or omit the date entirely). The shallow
// guard needs git >= 2.15 (`--is-shallow-repository`); older git is treated as
// a full clone.
export function gitLastModified(
  filePath: string,
  cwd: string = process.cwd(),
): Date | null {
  try {
    if (!canUseGitDates(cwd)) {
      return null;
    }
    const commit = selectContentCommit(readFileCommits(filePath, cwd), (hash) =>
      countMarkdownFilesInCommit(hash, cwd),
    );
    if (!commit) {
      return null;
    }
    const date = new Date(commit.isoDate);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}
