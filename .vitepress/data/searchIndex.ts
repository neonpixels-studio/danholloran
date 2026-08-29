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
