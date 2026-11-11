import type { Header } from "vitepress";

export type PostHeader = Pick<Header, "level" | "title" | "link">;

// Short posts stay clean: the TOC only appears once a post has this many h2s.
export const TOC_MIN_SECTIONS = 4;
const TOC_HEADING_LEVEL = 2;

// markdown.headers option: extract only the levels the TOC lists.
export const POST_MARKDOWN_HEADERS = { level: [TOC_HEADING_LEVEL] };

export function tocSections(headers: PostHeader[] = []): PostHeader[] {
  const sections = headers.filter(
    (header) => header.level === TOC_HEADING_LEVEL,
  );
  return sections.length >= TOC_MIN_SECTIONS ? sections : [];
}
