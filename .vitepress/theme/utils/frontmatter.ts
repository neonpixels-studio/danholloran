import { parse } from "yaml";

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
