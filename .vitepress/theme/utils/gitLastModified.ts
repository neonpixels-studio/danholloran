import { execFileSync } from "child_process";

// The real last-content-change date for a file: the author date of its most
// recent commit. File mtime and HTTP `Last-Modified` headers are unreliable
// freshness signals — on a fresh CI clone/build, both degrade to checkout
// (build) time, signalling false freshness on every deploy regardless of
// whether the underlying content actually changed. Returns null for an
// untracked file or when git isn't available, so the caller can fall back to
// mtime (or omit the date entirely).
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
    return iso ? new Date(iso) : null;
  } catch {
    return null;
  }
}
