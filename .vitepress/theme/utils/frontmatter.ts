import { parse } from "yaml";

// Coerced, not dropped: an unquoted YAML scalar (number/date/bool) still
// renders as something meaningful; only null/undefined fall back to "".
export function coerceFrontmatterString(value: unknown): string {
  return value == null ? "" : String(value);
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
