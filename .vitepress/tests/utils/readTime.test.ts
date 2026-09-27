import { describe, it, expect } from "vitest";
import { calculateReadTime } from "../../theme/utils/readTime";

function makeWords(count: number): string {
  return Array.from({ length: count }, (_, i) => `word${i}`).join(" ");
}

describe("calculateReadTime", () => {
  it("returns 1 for an empty string", () => {
    expect(calculateReadTime("")).toBe(1);
  });

  it("returns 1 for a whitespace-only string", () => {
    expect(calculateReadTime("   \n\t  ")).toBe(1);
  });

  it("returns 1 for a single word", () => {
    expect(calculateReadTime("hello")).toBe(1);
  });

  it("returns 1 for fewer than 100 words", () => {
    expect(calculateReadTime(makeWords(50))).toBe(1);
  });

  it("returns 1 for 199 words", () => {
    expect(calculateReadTime(makeWords(199))).toBe(1);
  });

  it("returns 1 for exactly 200 words", () => {
    expect(calculateReadTime(makeWords(200))).toBe(1);
  });

  it("returns 2 for 300 words", () => {
    expect(calculateReadTime(makeWords(300))).toBe(2);
  });

  it("returns 2 for 400 words", () => {
    expect(calculateReadTime(makeWords(400))).toBe(2);
  });

  it("handles multiple consecutive whitespace types", () => {
    const content = "word1  \t  word2\n\nword3";
    expect(calculateReadTime(content)).toBe(1);
  });

  it("trims leading and trailing whitespace before counting", () => {
    const padded = "  " + makeWords(200) + "  ";
    expect(calculateReadTime(padded)).toBe(1);
  });

  it("excludes frontmatter from the word count", () => {
    // 200 words of frontmatter-shaped filler plus 200 words of prose: if
    // the frontmatter block leaked into the count this would round up to 2.
    const frontmatter = `---\ndescription: "${makeWords(200)}"\n---\n`;
    const withFrontmatter = frontmatter + makeWords(200);
    expect(calculateReadTime(withFrontmatter)).toBe(1);
  });

  it("counts the same prose word count whether or not frontmatter is present", () => {
    // 299 words sits just under the 1-minute rounding boundary (299 / 200 =
    // 1.495 -> 1); if even a couple of frontmatter tokens leaked into the
    // count, the total would cross into rounding up to 2, so this actually
    // fails if parseFrontmatter isn't wired in.
    const prose = makeWords(299);
    const frontmatter = `---\ntitle: "Example"\n---\n`;
    expect(calculateReadTime(frontmatter + prose)).toBe(
      calculateReadTime(prose),
    );
  });

  it("excludes fenced code blocks from the word count", () => {
    // 200 words of prose (rounds to 1) plus a 300-word-shaped fenced code
    // block: if the code block leaked into the count, 500 total words would
    // round up to 3.
    const prose = makeWords(200);
    const codeBlock = "```js\n" + makeWords(300) + "\n```";
    expect(calculateReadTime(prose + "\n\n" + codeBlock)).toBe(1);
  });

  it("excludes multiple fenced code blocks using different fence characters", () => {
    const prose = makeWords(400);
    const backtickBlock = "```bash\n" + makeWords(500) + "\n```";
    const tildeBlock = "~~~\n" + makeWords(500) + "\n~~~";
    const content = [prose, backtickBlock, tildeBlock].join("\n\n");
    expect(calculateReadTime(content)).toBe(calculateReadTime(prose));
  });

  it("only strips a closing fence that matches the opening fence's exact string", () => {
    // A 4-backtick fence can safely contain a nested 3-backtick fence (this
    // repo does this for posts about writing markdown, e.g.
    // dataviewjs-the-escape-hatch-when-bases-and-dql-run-out.md). The whole
    // outer block, nested fence included, must still count as code.
    //
    // 299 words sits just under the rounding boundary (see the frontmatter
    // test above); if the backreference were dropped for a generic
    // `` `{3,}` `` match, the inner ``` line would wrongly end the block
    // early and leak "console.log(1)\n```\n````" (a few words) into the
    // count, crossing the boundary and failing this assertion.
    const prose = makeWords(299);
    const nestedFence = "````md\n```js\nconsole.log(1)\n```\n````";
    expect(calculateReadTime(prose + "\n\n" + nestedFence)).toBe(
      calculateReadTime(prose),
    );
  });

  it("does not treat a fence-shaped line with trailing text as the closer", () => {
    // CommonMark requires a closing fence line to contain nothing but the
    // fence characters (plus optional trailing whitespace) - a line like
    // "```js" appearing mid-block is code content, not a closer, even though
    // it starts with the same three backticks as the real closer.
    const prose = makeWords(299);
    const codeBlock = "```\ncode line one\n```js\ncode line two\n```";
    expect(calculateReadTime(prose + "\n\n" + codeBlock)).toBe(
      calculateReadTime(prose),
    );
  });

  it("accepts a closing fence longer than the opening fence", () => {
    // CommonMark allows the closer to be *at least* as long as the opener
    // (not just an exact match), e.g. a ``` opener closed by a ```` line.
    const prose = makeWords(299);
    const codeBlock = "```\ncode line\n````";
    expect(calculateReadTime(prose + "\n\n" + codeBlock)).toBe(
      calculateReadTime(prose),
    );
  });

  it("treats an unterminated fence as code through the end of the content", () => {
    // A fence with no matching closer runs to the end of the document under
    // CommonMark; this must not fall back to counting the "unclosed" code as
    // prose.
    const prose = makeWords(299);
    const unterminated = "```ts\n" + makeWords(50);
    expect(calculateReadTime(prose + "\n\n" + unterminated)).toBe(
      calculateReadTime(prose),
    );
  });

  it("reports a lower read time for a real code-heavy post than the raw markdown would", () => {
    const rawMarkdown = [
      "---",
      'title: "Example"',
      "---",
      "",
      makeWords(150),
      "",
      "```ts",
      makeWords(400),
      "```",
      "",
      makeWords(50),
    ].join("\n");
    const rawWordCount = rawMarkdown.trim().split(/\s+/).length;
    const rawBasedReadTime = Math.max(1, Math.round(rawWordCount / 200));

    expect(calculateReadTime(rawMarkdown)).toBeLessThan(rawBasedReadTime);
    // Only the 150 + 50 = 200 prose words should count.
    expect(calculateReadTime(rawMarkdown)).toBe(1);
  });
});
