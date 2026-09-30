import { execFileSync } from "child_process";

// The real last-content-change date for a file: the committer date of its
// most recent commit (`%cI`, matching sitemap.ts's existing choice). The
// committer date is when a commit actually landed in this branch's history —
// a rebase or squash resets it while preserving the original author date, so
// it's the more accurate "how fresh is this history" signal for a build
// that's about to publish that history. File mtime and HTTP `Last-Modified`
// headers are unreliable freshness signals — on a fresh CI clone/build, both
// degrade to checkout (build) time, signalling false freshness on every
// deploy regardless of whether the underlying content actually changed.
// Returns null for an untracked file, unparseable git output, or when git
// isn't available, so the caller can fall back to mtime (or omit the date
// entirely).
export function gitLastModified(
  filePath: string,
  cwd: string = process.cwd(),
): Date | null {
  try {
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
