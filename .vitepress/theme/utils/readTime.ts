import { parseFrontmatter } from "./frontmatter";

// Matches a fenced code block from its opening fence through the matching
// closing fence:
//  - Group 1 (`\1`) is the whole opening fence string, group 2 (`\2`) is just
//    its fence character. The closer must repeat group 1 verbatim, optionally
//    followed by more of the same character (`\1\2*`) - i.e. it must be at
//    least as long as the opener, per CommonMark. This is also how a longer
//    outer fence safely contains a shorter one nested inside (see
//    dataviewjs-the-escape-hatch-when-bases-and-dql-run-out.md, which nests
//    ``` inside ````): the inner ``` can't match the outer ```` opener's \1.
//  - The closer alternative requires the fence characters to be the only
//    non-whitespace content on the line (`[ \t]*\r?$`), matching CommonMark:
//    a mid-block line like "```js" is code content, not a closer, even
//    though it starts with the same three backticks.
//  - The final `|[\s\S]*$` alternative handles an unclosed fence (runs to
//    end of content), matching CommonMark's rule that an unterminated fence
//    still counts as one code block rather than leaking as prose.
// @todo Strip fences nested under list markers once a real corpus need
// shows up cleanly (installing-linters-atom.md mixes 3-/4-backtick fences
// inconsistently under list items, so it's not a safe pattern to guess at
// with a regex today - see the PR follow-up suggestion).
const FENCED_CODE_BLOCK =
  /^ {0,3}((`|~)\2{2,})[^\n]*\n(?:[\s\S]*?^ {0,3}\1\2*[ \t]*\r?$|[\s\S]*$)/gm;

export function calculateReadTime(content: string): number {
  const { content: withoutFrontmatter } = parseFrontmatter(content);
  const prose = withoutFrontmatter.replace(FENCED_CODE_BLOCK, " ");
  const wordCount = prose.trim().split(/\s+/).length;
  return Math.max(1, Math.round(wordCount / 200));
}
