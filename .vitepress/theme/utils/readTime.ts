import { parseFrontmatter } from "./frontmatter";

// Matches a fenced code block from its opening fence through the matching
// closing fence:
//  - The backreference (`\1`) pins the closer to the exact same fence string
//    the opener used (e.g. ` ``` ` vs ` ```` `), which is how CommonMark lets
//    a longer outer fence safely contain a shorter one nested inside (see
//    dataviewjs-the-escape-hatch-when-bases-and-dql-run-out.md, which nests
//    ``` inside ````).
//  - The closer alternative requires the fence characters to be the only
//    non-whitespace content on the line (`[ \t]*\r?$`), matching CommonMark:
//    a mid-block line like "```js" is code content, not a closer, even
//    though it starts with the same three backticks.
//  - The final `|[\s\S]*$` alternative handles an unclosed fence (runs to
//    end of content), matching CommonMark's rule that an unterminated fence
//    still counts as one code block rather than leaking as prose.
// Only fenced blocks are stripped, not 4-space-indented code or fences
// nested under list markers, since every well-formed post in this repo's
// corpus fences its code at the top level; list-nested fences are also
// legitimately ambiguous in this corpus (see
// installing-linters-atom.md, which mixes 3- and 4-backtick fences
// inconsistently) and are flagged as a follow-up rather than guessed at here.
const FENCED_CODE_BLOCK =
  /^ {0,3}(`{3,}|~{3,})[^\n]*\n(?:[\s\S]*?^ {0,3}\1[ \t]*\r?$|[\s\S]*$)/gm;

export function calculateReadTime(content: string): number {
  const { content: withoutFrontmatter } = parseFrontmatter(content);
  const prose = withoutFrontmatter.replace(FENCED_CODE_BLOCK, " ");
  const wordCount = prose.trim().split(/\s+/).length;
  return Math.max(1, Math.round(wordCount / 200));
}
