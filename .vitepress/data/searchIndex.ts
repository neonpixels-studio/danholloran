import type { ProjectInterface, SearchItem } from "@typedefs";

// Projects without their own URL point at the home page projects section.
export const PROJECTS_ANCHOR = "/#projects";

// Matches `[text](url)` and `![alt](src)`, tolerating one level of parentheses
// inside the URL (e.g. Wikipedia slugs) so no stray `)` leaks into keywords.
const MARKDOWN_LINK = /!?\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g;

// Project descriptions are markdown; keep the link text, drop the URLs so raw
// hosts (github.com, org, wikipedia) don't leak into the search index.
function toPlainText(markdown: string): string {
  return markdown.replace(MARKDOWN_LINK, "$1");
}

const pages: SearchItem[] = [
  {
    type: "page",
    title: "Home",
    desc: "About, projects, experience, latest posts",
    href: "/",
    kw: "home about projects experience",
  },
  {
    type: "page",
    title: "Resume",
    desc: "Full professional history & download",
    href: "/resume",
    kw: "resume cv work history",
  },
  {
    type: "page",
    title: "Blog",
    desc: "All posts, filterable by tag",
    href: "/posts/",
    kw: "blog posts writing articles",
  },
  {
    type: "page",
    title: "Grimicorn Theme",
    desc: "Calm, low-fatigue color theme — dark & light, for VS Code, terminals & more",
    href: "/themes/grimicorn",
    kw: "themes grimicorn color theme palette vscode terminal obsidian claude code dark light download",
  },
  {
    type: "page",
    title: "Grimicorn Neon",
    desc: "The always-on-rave variant — electric neon palette on near-black, for every tool",
    href: "/themes/grimicorn-neon",
    kw: "themes grimicorn neon rave color theme palette vscode terminal pink cyan dark download",
  },
];

export function projectToSearchItem(project: ProjectInterface): SearchItem {
  const skillNames = project.skills.map((skill) => skill.name).join(" ");
  return {
    type: "project",
    title: project.title,
    desc: project.company,
    href: project.url || PROJECTS_ANCHOR,
    kw: `${project.company} ${skillNames} ${toPlainText(project.content)}`,
  };
}

export function buildStaticSearchItems(
  projects: ProjectInterface[],
): SearchItem[] {
  return [...pages, ...projects.map(projectToSearchItem)];
}

// A project may link to its own blog post. Rather than index the same href
// twice, fold the project's title and keywords into the post entry so it stays
// findable by project name/skills, and drop the duplicate static entry.
//
// Order here doesn't matter for full-text search (MiniSearch ranks by match
// score, not insertion order) — it only matters for the empty-query preview
// panel, which has its own explicit ordering in buildEmptyQueryResults below.
export function mergeSearchIndex(
  staticItems: SearchItem[],
  postItems: SearchItem[],
): SearchItem[] {
  const staticByHref = new Map(staticItems.map((item) => [item.href, item]));
  const mergedPosts = postItems.map((post) => {
    const collision = staticByHref.get(post.href);
    if (!collision) {
      return post;
    }
    return { ...post, kw: `${post.kw} ${collision.title} ${collision.kw}` };
  });
  const postHrefs = new Set(postItems.map((item) => item.href));
  return [
    ...staticItems.filter((item) => !postHrefs.has(item.href)),
    ...mergedPosts,
  ];
}

// Number of results the search panel shows at once, for both the empty-query
// preview and a query's top matches. Exported so it's one source of truth
// shared by the component and its tests, instead of a repeated literal.
export const SEARCH_PANEL_SIZE = 8;

// Number of static pages allowed to *lead* the empty-query panel. Capped so
// an ever-growing pages list can't crowd out posts the way projects did
// before this fix. Pages beyond the cap aren't dropped — buildEmptyQueryResults
// backfills them at the tail if posts/projects don't fill the panel.
export const EMPTY_QUERY_PAGE_LIMIT = 3;

// A Record keyed by every SearchItem type, rather than three separate
// .filter() calls, so adding a new type to the union is a compile error here
// instead of that type silently vanishing from the empty-query panel.
function groupByType(
  items: SearchItem[],
): Record<SearchItem["type"], SearchItem[]> {
  const groups: Record<SearchItem["type"], SearchItem[]> = {
    page: [],
    post: [],
    project: [],
  };
  for (const item of items) {
    groups[item.type].push(item);
  }
  return groups;
}

// The empty-query panel is a curated preview, not full-text search results,
// so it gets its own explicit order: a few top-level pages for navigation,
// then the newest posts (the content that actually changes week to week),
// then projects, then any pages left over once the cap is applied. `items`
// is expected pre-sorted by recency within each type (postItems already
// sorts newest-first).
//
// With enough posts to fill the remaining slots on their own, projects (and
// overflow pages) won't appear in the panel at all — that's intentional:
// posts are the content most worth surfacing here, and everything else is
// still one click away via the Blog/Home pages or a real search query.
export function buildEmptyQueryResults(
  items: SearchItem[],
  panelSize: number = SEARCH_PANEL_SIZE,
): SearchItem[] {
  const {
    page: pageItems,
    post: postItems,
    project: projectItems,
    ...otherTypeItems
  } = groupByType(items);
  const leadingPages = pageItems.slice(0, EMPTY_QUERY_PAGE_LIMIT);
  const overflowPages = pageItems.slice(EMPTY_QUERY_PAGE_LIMIT);
  const ordered = [
    ...leadingPages,
    ...postItems,
    ...projectItems,
    ...overflowPages,
    ...Object.values(otherTypeItems).flat(),
  ];
  return ordered.slice(0, Math.max(0, panelSize));
}
