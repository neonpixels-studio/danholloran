import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { topicFeedHref } from "./archive";
import { topicBuckets } from "./archivePaths";
import {
  loadPublishedPosts,
  loadUnpublishedPostSlugs,
  type PublishedPost,
} from "./loadPublishedPosts";
import { buildNotFoundRecoveryHtml } from "./notFoundRecovery";

const FEED_FILE = "feed.xml";
const SITEMAP_FILE = "sitemap.xml";
const LLMS_FILE = "llms.txt";
const NOT_FOUND_FILE = "404.html";
const TOPIC_FEEDS_DIRECTORY = "topic";
const TOPIC_FEED_FILE = "feed.xml";
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

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Matches the post's URL but not a longer slug that merely starts with it
// (an unpublished "foo" must not flag a published "foo-bar").
function postUrlPattern(slug: string): RegExp {
  return new RegExp(`/posts/${escapeRegExp(slug)}(?![\\w-])`);
}

// Every topic feed actually written, not just the published topics' feeds, so
// an unpublished post can't hide in a feed for a topic only it uses.
function writtenTopicFeeds(outDir: string): string[] {
  const topicsDirectory = join(outDir, TOPIC_FEEDS_DIRECTORY);
  if (!existsSync(topicsDirectory)) {
    return [];
  }
  return readdirSync(topicsDirectory)
    .map((topic) => join(TOPIC_FEEDS_DIRECTORY, topic, TOPIC_FEED_FILE))
    .filter((file) => existsSync(join(outDir, file)));
}

function postListingFiles(outDir: string): string[] {
  return [FEED_FILE, SITEMAP_FILE, LLMS_FILE, ...writtenTopicFeeds(outDir)]
    .filter((file) => existsSync(join(outDir, file)))
    .sort();
}

function describePostLeaks(
  outDir: string,
  slug: string,
  listings: Map<string, string>,
): string[] {
  const leaks: string[] = [];
  if (existsSync(join(outDir, `posts/${slug}.html`))) {
    leaks.push(`posts/${slug}.html was built for unpublished post "${slug}"`);
  }
  const urlPattern = postUrlPattern(slug);
  for (const [file, contents] of listings) {
    if (urlPattern.test(contents)) {
      leaks.push(`${file} links unpublished post "${slug}"`);
    }
  }
  return leaks;
}

// Drafts, and scheduled posts on production builds, must 404 and stay out of
// every feed, the sitemap, and llms.txt. Cross-posting tools treat a 404 as
// "not live yet", so a built-but-unlisted page would go out early. One line
// per leak; an empty list means nothing unpublished shipped.
export function findUnpublishedPostLeaks(
  outDir: string,
  unpublishedSlugs: string[] = loadUnpublishedPostSlugs(),
): string[] {
  const listings = new Map(
    postListingFiles(outDir).map((file) => [
      file,
      readFileSync(join(outDir, file), "utf-8"),
    ]),
  );
  return unpublishedSlugs.flatMap((slug) =>
    describePostLeaks(outDir, slug, listings),
  );
}
