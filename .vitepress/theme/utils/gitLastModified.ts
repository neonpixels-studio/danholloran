import { execFileSync } from "child_process";

// Per-cwd cache: sitemap generation calls gitLastModified per page, and the
// answer can't change mid-build. Also keeps the warning to a single line.
const gitDatesUsableByCwd = new Map<string, boolean>();

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

export function resetShallowRepositoryCache(): void {
  gitDatesUsableByCwd.clear();
}

// The real last-content-change date for a file: the committer date of its
// most recent commit (`%cI`, matching sitemap.ts's existing choice). The
// committer date is when a commit actually landed in this branch's history —
// a rebase or squash resets it while preserving the original author date, so
// it's the more accurate "how fresh is this history" signal for a build
// that's about to publish that history. File mtime and HTTP `Last-Modified`
// headers are unreliable freshness signals — on a fresh CI clone/build, both
// degrade to checkout (build) time, signalling false freshness on every
// deploy regardless of whether the underlying content actually changed.
// Returns null for an untracked file, unparseable git output, when git
// isn't available, or on a shallow clone (where `git log -1 -- <file>` reports
// the single fetched commit for every file), so the caller can fall back to
// mtime (or omit the date entirely). The shallow guard needs git >= 2.15
// (`--is-shallow-repository`); older git is treated as a full clone.
export function gitLastModified(
  filePath: string,
  cwd: string = process.cwd(),
): Date | null {
  try {
    if (!canUseGitDates(cwd)) {
      return null;
    }
    const iso = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", filePath],
      { cwd, encoding: "utf-8" },
    ).trim();
    if (!iso) {
      return null;
    }
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}
