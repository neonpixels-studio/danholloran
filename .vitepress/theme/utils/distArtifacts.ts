import { readFileSync, statSync } from "fs";
import { join } from "path";
import { topicFeedHref } from "./archive";
import { topicBuckets } from "./archivePaths";
import { loadPublishedPosts, type PublishedPost } from "./loadPublishedPosts";
import { buildNotFoundRecoveryHtml } from "./notFoundRecovery";

const FEED_FILE = "feed.xml";
const SITEMAP_FILE = "sitemap.xml";
const LLMS_FILE = "llms.txt";
const NOT_FOUND_FILE = "404.html";
export const NOT_FOUND_RECOVERY_LABEL = "the no-JS recovery block";

type ContentInspector = (_contents: string) => string | null;

export type DistCheck = {
  file: string;
  // Returns a description of what is wrong with the file's contents, or null.
  inspect: ContentInspector;
};

export function requireText(marker: string, label = marker): ContentInspector {
  return (contents) =>
    contents.includes(marker) ? null : `does not contain ${label}`;
}

export function requireNonEmpty(contents: string): string | null {
  return contents.trim() === "" ? "is empty" : null;
}

function postChecks(posts: PublishedPost[]): DistCheck[] {
  return posts.map((post) => ({
    file: `posts/${post.slug}.html`,
    inspect: requireNonEmpty,
  }));
}

function topicFeedChecks(posts: PublishedPost[]): DistCheck[] {
  return topicBuckets(posts).map((bucket) => ({
    file: topicFeedHref(bucket.slug).replace(/^\//, ""),
    inspect: requireText("<rss"),
  }));
}

// Everything `vitepress build` (including config.ts `buildEnd`) must leave in
// the output directory, derived from the same loaders the generators use so a
// newly published post or topic is expected automatically.
export function expectedDistChecks(): DistCheck[] {
  const posts = loadPublishedPosts();
  return [
    { file: FEED_FILE, inspect: requireText("<item>") },
    ...topicFeedChecks(posts),
    { file: SITEMAP_FILE, inspect: requireText("<loc>") },
    { file: LLMS_FILE, inspect: requireNonEmpty },
    {
      file: NOT_FOUND_FILE,
      inspect: requireText(
        buildNotFoundRecoveryHtml(),
        NOT_FOUND_RECOVERY_LABEL,
      ),
    },
    ...postChecks(posts),
  ];
}

function describeProblem(outDir: string, check: DistCheck): string | null {
  const path = join(outDir, check.file);
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats) {
    return `${check.file} is missing`;
  }
  if (!stats.isFile()) {
    return `${check.file} is not a file`;
  }
  const problem = check.inspect(readFileSync(path, "utf-8"));
  return problem ? `${check.file} ${problem}` : null;
}

// One human-readable line per missing or malformed build artifact; an empty
// list means the output directory is complete.
export function findDistProblems(
  outDir: string,
  checks: DistCheck[] = expectedDistChecks(),
): string[] {
  return checks
    .map((check) => describeProblem(outDir, check))
    .filter((problem): problem is string => problem !== null);
}
