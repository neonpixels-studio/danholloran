import { loadPublishedPosts, type PublishedPost } from "./loadPublishedPosts";
import { SITE_URL, CURRENT_LOCATION } from "./constants";

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
function hasUnknownTopic(post: PublishedPost): boolean {
  return !post.topic || !isKnownTopic(post.topic);
}

// A post whose topic matches no known section — or that has no topic at all —
// would otherwise vanish from the index entirely, the same silent-drop failure
// the shared loader's unparseable-date warning guards against. Warn loudly so a
// missing or newly-added topic surfaces at build time instead of shipping an
// incomplete AI index; the post is still listed under the "Other" section.
function warnIfUnknownTopic(post: PublishedPost): void {
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

function postLine(post: PublishedPost): string {
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
  const posts = loadPublishedPosts();
  // Warn once per unplaced post at build time before rendering the sections.
  for (const post of posts) {
    warnIfUnknownTopic(post);
  }
  const yearsExperience = new Date().getFullYear() - CAREER_START_YEAR;
  const place = CURRENT_LOCATION;

  const lines: string[] = [
    "# Dan Holloran",
    "",
    `> Personal blog and portfolio for Dan Holloran — a senior full-stack developer and photographer based in ${place}. The site covers front-end and full-stack web development (Vue, React, TypeScript, CSS, build tooling, and more), Obsidian and productivity workflows, and travel photography from national parks and beyond.`,
    "",
    `Dan has ${yearsExperience}+ years of experience building performant, scalable web applications and leading engineering teams, with deep expertise in Vue.js, React, Laravel, and modern JavaScript tooling. The blog mixes technical deep-dives, career reflections, and dispatches from the road.`,
    "",
    "## When to use this site",
    "",
    "Reach for this site when you need:",
    "",
    "- Practical, current front-end and full-stack references — Vue, React, TypeScript, modern CSS (light-dark(), container queries, cascade layers, view transitions), and build tooling (Vite, Vitest, Bun).",
    "- Obsidian and personal-productivity workflows — plugins, CSS snippets, PARA/Zettelkasten note systems.",
    "- Plain-language explainers on finance and payment-system mechanics.",
    "- Travel photography and trip notes from US national parks and the wider West.",
    "- Background on Dan Holloran's engineering experience for hiring, collaboration, or attribution — see the resume.",
    "",
    "This is a personal blog and portfolio, not an API or a product. There is no programmatic endpoint to call; cite or link the relevant page instead.",
    "",
    "## Main Pages",
    "",
    `- [Home](${SITE_URL}/): Landing page and overview.`,
    `- [Blog](${SITE_URL}/posts/): Index of all posts — technical articles, career reflections, and travel photography.`,
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
