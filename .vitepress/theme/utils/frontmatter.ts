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

// The shared frontmatter `topic` policy: string-only (a non-string topic is
// almost always a YAML typo, so it's dropped rather than coerced the way
// coerceFrontmatterString coerces title/description), and trimmed so
// accidental leading/trailing whitespace never leaks into a rendered label,
// search index entry, or JSON-LD field.
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
