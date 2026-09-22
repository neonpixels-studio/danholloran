import { parse } from "yaml";

// Coerced, not dropped: an unquoted YAML scalar (number/bool, or a Date —
// yaml parses YAML 1.1 timestamps into real Date objects) still renders as
// something meaningful. null/undefined fall back to "". A mapping or sequence
// under the key isn't a scalar the author meant to display, so it also falls
// back to "" rather than surfacing `String()`'s "[object Object]"/"a,b".
export function coerceFrontmatterString(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "object" && !(value instanceof Date)) {
    return "";
  }
  return String(value);
}

// The shared frontmatter `topic` policy: string-only (never coerce a numeric
// or boolean topic the way coerceFrontmatterString does — a non-string topic
// almost always means a frontmatter typo, not an intentional scalar), trimmed
// so accidental leading/trailing whitespace in the YAML never leaks into a
// rendered label, search index entry, or JSON-LD field. Previously
// hand-duplicated across search.data.ts, archivePaths.ts, and
// pageTransform.ts, with archivePaths.ts missing the trim — a whitespace-
// padded topic reached its archive page heading/label untrimmed while the
// other two surfaces trimmed it.
export function normalizeFrontmatterTopic(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { data: {}, content: raw };
  }
  const data = (parse(match[1]) as Record<string, unknown>) ?? {};
  const content = raw.slice(match[0].length);
  return { data, content };
}
