import { join } from "path";
import { gitLastModified } from "./gitLastModified";
import { POSTS_DIR } from "./loadPublishedPosts";

export interface PostDates {
  published: string;
  modified: string;
}

// Frontmatter dates are YAML: usually an ISO string, but yaml parses YAML 1.1
// timestamps into real Date objects. Returns an ISO 8601 string, or null when
// the value is absent or unparseable.
function toIsoString(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return null;
  }
  return value;
}

// Null on a shallow clone (CI/Netlify) or an untracked file, so the caller
// degrades to the publish date instead of publishing a wrong date.
function gitModifiedIso(slug: string): string | null {
  const gitDate = gitLastModified(join(POSTS_DIR, `${slug}.md`));
  return gitDate ? gitDate.toISOString() : null;
}

// Modified date priority: frontmatter dateModified, then the git last-modified
// date, then the publish date. Never earlier than the publish date.
// Returns null when the post has no usable publish date.
export function resolvePostDates(
  data: Record<string, unknown>,
  slug: string,
): PostDates | null {
  const published = toIsoString(data.date);
  if (!published) {
    return null;
  }
  const modified =
    toIsoString(data.dateModified) ?? gitModifiedIso(slug) ?? published;
  if (Date.parse(modified) < Date.parse(published)) {
    return { published, modified: published };
  }
  return { published, modified };
}
