import { parseFrontmatter } from "./frontmatter";

// Matches a fenced code block from its opening fence through the matching
// closing fence. The backreference (`\1`) pins the closer to the exact same
// fence string the opener used (e.g. ` ``` ` vs ` ```` `), which is how
// CommonMark lets a longer outer fence safely contain a shorter one nested
// inside (see dataviewjs-the-escape-hatch-when-bases-and-dql-run-out.md,
// which nests ``` inside ````). Only fenced blocks are stripped, not
// 4-space-indented code, since every post in this repo's corpus fences its
// code; an indented-code rule is much harder to write correctly (list-item
// continuations use the same 4-space indent and are prose, not code) and
// would risk stripping real prose for a case that doesn't occur here.
const FENCED_CODE_BLOCK =
  /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*$/gm;

export function calculateReadTime(content: string): number {
  const { content: withoutFrontmatter } = parseFrontmatter(content);
  const prose = withoutFrontmatter.replace(FENCED_CODE_BLOCK, " ");
  const wordCount = prose.trim().split(/\s+/).length;
  return Math.max(1, Math.round(wordCount / 200));
}
