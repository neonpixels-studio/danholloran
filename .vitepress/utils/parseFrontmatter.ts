export interface FrontmatterResult<T = Record<string, unknown>> {
  data: T;
  content: string;
}
// @todo Remove this since Vitepress does this for us
export function parseFrontmatter<T = Record<string, unknown>>(
  raw: string,
): FrontmatterResult<T> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {} as T, content: raw };

  const yamlStr = match[1];
  const content = match[2].trim();
  const data: Record<string, unknown> = {};

  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    if (!key) continue;
    const val = line.slice(colonIdx + 1).trim();

    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      data[key] = val.slice(1, -1);
    } else if (val.startsWith("[") && val.endsWith("]")) {
      data[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (val === "true") {
      data[key] = true;
    } else if (val === "false") {
      data[key] = false;
    } else if (val !== "" && !isNaN(Number(val))) {
      data[key] = Number(val);
    } else {
      data[key] = val;
    }
  }

  return { data: data as T, content };
}
