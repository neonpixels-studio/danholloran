import { join } from "path";
import { gitLastModified } from "./gitLastModified";
import { POSTS_DIR } from "./loadPublishedPosts";

export interface PostDates {
  published: string;
  modified: string;
}

// Date-only or full datetime with an offset. Anything else Date.parse accepts
// ("March 1, 2024") is not valid ISO 8601 for article:* meta or schema.org.
const ISO_8601_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/;

// V8 rolls an impossible day like "2024-02-30" forward instead of returning
// NaN. A date-only string parses as UTC midnight, so it must round-trip.
function isSameCalendarDay(parsed: Date, value: string): boolean {
  if (value.includes("T")) {
    return true;
  }
  return parsed.toISOString().startsWith(value);
}

// Frontmatter dates are YAML: usually an ISO string, but yaml parses YAML 1.1
// timestamps into real Date objects. Returns an ISO 8601 string, or null when
// the value is absent or unparseable.
function toIsoString(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value !== "string" || !ISO_8601_PATTERN.test(value)) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || !isSameCalendarDay(parsed, value)) {
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
