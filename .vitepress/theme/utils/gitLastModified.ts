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
// Returns null for an untracked file, unparseable git output, when git
// isn't available, or on a shallow clone (where `git log -1 -- <file>` reports
// the single fetched commit for every file), so the caller can fall back to
// mtime (or omit the date entirely).
const shallowByCwd = new Map<string, boolean>();

// Checked once per cwd: sitemap generation calls gitLastModified per page, and
// the answer can't change mid-build. Also keeps the warning to a single line.
function isShallowRepository(cwd: string): boolean {
  const cached = shallowByCwd.get(cwd);
  if (cached !== undefined) {
    return cached;
  }
  const output = execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
    cwd,
    encoding: "utf-8",
  }).trim();
  const isShallow = output === "true";
  if (isShallow) {
    console.warn(
      "gitLastModified: shallow git clone detected; commit dates are unreliable, so returning null. Use fetch-depth: 0 for accurate lastmod dates.",
    );
  }
  shallowByCwd.set(cwd, isShallow);
  return isShallow;
}

export function resetShallowRepositoryCache(): void {
  shallowByCwd.clear();
}

export function gitLastModified(
  filePath: string,
  cwd: string = process.cwd(),
): Date | null {
  try {
    if (isShallowRepository(cwd)) {
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
