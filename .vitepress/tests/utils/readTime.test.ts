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
    const prose = makeWords(300);
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
    const prose = makeWords(300);
    const nestedFence = "````md\n```js\nconsole.log(1)\n```\n````";
    expect(calculateReadTime(prose + "\n\n" + nestedFence)).toBe(
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
