import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";
import { SITE_URL, CURRENT_LOCATION } from "./constants";

const POSTS_DIR = join(process.cwd(), ".vitepress/content/posts");

/** The year Dan's professional experience is counted from. */
export const CAREER_START_YEAR = 2012;

/** Display names and ordering for the `topic` frontmatter field. */
const TOPIC_SECTIONS: { topic: string; heading: string }[] = [
  { topic: "development", heading: "Development" },
  { topic: "obsidian", heading: "Obsidian & Productivity" },
  { topic: "finance", heading: "Finance" },
  { topic: "travel", heading: "Travel & Photography" },
];

/** Catch-all heading for posts whose topic matches no known section. */
const OTHER_HEADING = "Other";

function isKnownTopic(topic: string): boolean {
  return TOPIC_SECTIONS.some((section) => section.topic === topic);
}

// True when a post would otherwise fall through every known section: it either
// carries a topic none of TOPIC_SECTIONS recognizes, or carries no topic at
// all. Shared by the warning and the "Other" section so the two can never
// disagree about which posts are unplaced.
function hasUnknownTopic(post: PostMeta): boolean {
  return !post.topic || !isKnownTopic(post.topic);
}

interface PostMeta {
  title: string;
  description?: string;
  topic?: string;
  date?: string;
  draft?: boolean;
  slug: string;
}

// Sort key for newest-first ordering. Posts with no date, or a date that
// fails to parse, sort to the end. A finite sentinel (rather than -Infinity)
// keeps `postSortTime(b) - postSortTime(a)` a real number for any pair of
// posts, including two undated ones.
const UNDATED_SORT_TIME = Number.MIN_SAFE_INTEGER;

function postSortTime(post: PostMeta): number {
  if (!post.date) {
    return UNDATED_SORT_TIME;
  }
  const time = new Date(post.date).getTime();
  return Number.isNaN(time) ? UNDATED_SORT_TIME : time;
}

// Unlike generateFeed (which drops a post with an unparseable date entirely),
// llms.txt keeps it — sorted to the end, same as an undated post — since an
// incomplete listing here is lower-stakes than a broken RSS pubDate. Still
// warn loudly, since it usually points at a frontmatter typo.
function warnIfDateUnparseable(post: PostMeta): void {
  if (!post.date) {
    return;
  }
  if (Number.isNaN(new Date(post.date).getTime())) {
    console.warn(
      `generateLlmsTxt: post "${post.slug}" has an unparseable date "${post.date}"; sorting it to the end`,
    );
  }
}

// A post whose topic matches no known section — or that has no topic at all —
// would otherwise vanish from the index entirely, the same silent-drop failure
// the date handling guards against. Warn loudly (mirroring
// warnIfDateUnparseable) so a missing or newly-added topic surfaces at build
// time instead of shipping an incomplete AI index; the post is still listed
// under the "Other" section.
function warnIfUnknownTopic(post: PostMeta): void {
  if (!hasUnknownTopic(post)) {
    return;
  }
  const topicDescription = post.topic
    ? `an unrecognized topic "${post.topic}"`
    : "no topic";
  console.warn(
    `generateLlmsTxt: post "${post.slug}" has ${topicDescription}; listing it under "${OTHER_HEADING}"`,
  );
}

function loadPosts(): PostMeta[] {
  const posts = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((file) => {
      const { data } = parseFrontmatter(
        readFileSync(join(POSTS_DIR, file), "utf-8"),
      );
      return { ...data, slug: file.replace(/\.md$/, "") } as PostMeta;
    })
    .filter((p) => !p.draft);

  for (const post of posts) {
    warnIfDateUnparseable(post);
    warnIfUnknownTopic(post);
  }

  // Newest first; undated posts (e.g. some travel entries) sort to the end.
  return posts.sort((a, b) => postSortTime(b) - postSortTime(a));
}

function postLine(post: PostMeta): string {
  const url = `${SITE_URL}/posts/${post.slug}`;
  const description = post.description ? `: ${post.description}` : "";
  // Fall back to the slug so a post missing its title (now reachable via the
  // "Other" section) never ships a literal "undefined" as its link text.
  const label = post.title || post.slug;
  return `- [${label}](${url})${description}`;
}

/**
 * Builds an llms.txt (https://llmstxt.org) for the site at build time so the
 * post list and location stay in sync with the content and
 * `.vitepress/data/location.json`.
 */
export function generateLlmsTxt(): string {
  const posts = loadPosts();
  const yearsExperience = new Date().getFullYear() - CAREER_START_YEAR;
  const place = CURRENT_LOCATION;

  const lines: string[] = [
    "# Dan Holloran",
    "",
    `> Personal blog and portfolio for Dan Holloran — a senior full-stack developer and photographer based in ${place}. The site covers front-end and full-stack web development (Vue, React, TypeScript, CSS, build tooling, and more), Obsidian and productivity workflows, and travel photography from national parks and beyond.`,
    "",
    `Dan has ${yearsExperience}+ years of experience building performant, scalable web applications and leading engineering teams, with deep expertise in Vue.js, React, Laravel, and modern JavaScript tooling. The blog mixes technical deep-dives, career reflections, and dispatches from the road.`,
    "",
    "## Main Pages",
    "",
    `- [Home](${SITE_URL}/): Landing page and overview.`,
    `- [Blog](${SITE_URL}/posts): Index of all posts — technical articles, career reflections, and travel photography.`,
    `- [Resume](${SITE_URL}/resume): Professional experience, skills, and projects.`,
  ];

  for (const { topic, heading } of TOPIC_SECTIONS) {
    const sectionPosts = posts.filter((p) => p.topic === topic);
    if (sectionPosts.length === 0) continue;
    lines.push("", `## ${heading}`, "", ...sectionPosts.map(postLine));
  }

  const otherPosts = posts.filter(hasUnknownTopic);
  if (otherPosts.length > 0) {
    lines.push("", `## ${OTHER_HEADING}`, "", ...otherPosts.map(postLine));
  }

  lines.push(
    "",
    "## Optional",
    "",
    `- [RSS Feed](${SITE_URL}/feed.xml): Full chronological feed of all posts.`,
    `- [Sitemap](${SITE_URL}/sitemap.xml): Complete list of all pages on the site.`,
    "- [GitHub](https://github.com/grimicorn): Open-source projects and code.",
    "- [LinkedIn](https://linkedin.com/in/dan-holloran/): Professional profile.",
    "",
  );

  return lines.join("\n");
}
