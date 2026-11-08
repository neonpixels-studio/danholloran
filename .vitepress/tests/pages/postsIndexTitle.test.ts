import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../../theme/utils/frontmatter";

const POSTS_INDEX_PATH = "posts/index.md";
const BLOG_KEYWORD = /\bblog\b/i;

describe("posts index page", () => {
  it("has a title containing the Blog keyword for search engines", () => {
    const raw = readFileSync(join(process.cwd(), POSTS_INDEX_PATH), "utf8");
    const { data } = parseFrontmatter(raw);

    expect(String(data.title)).toMatch(BLOG_KEYWORD);
  });
});
