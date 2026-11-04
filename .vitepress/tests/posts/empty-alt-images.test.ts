import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findEmptyAltImages } from "../../theme/utils/emptyAltImages";

const POSTS_DIR = join(__dirname, "..", "..", "content", "posts");

describe("findEmptyAltImages", () => {
  it("flags an image with empty alt text and reports its line", () => {
    const result = findEmptyAltImages("intro\n\n![](/images/posts/a.png)\n");
    expect(result).toEqual([{ line: 3, text: "![](/images/posts/a.png)" }]);
  });

  it("flags whitespace-only alt text", () => {
    expect(findEmptyAltImages("![  ](/a.png)")).toHaveLength(1);
  });

  it("accepts images that have alt text", () => {
    expect(findEmptyAltImages("![A diagram](/a.png)")).toEqual([]);
  });

  it("ignores image syntax inside fenced code blocks", () => {
    const markdown = "```md\n![](/a.png)\n```\n\n![](/b.png)";
    expect(findEmptyAltImages(markdown).map((entry) => entry.line)).toEqual([
      5,
    ]);
  });
});

describe("post markdown images", () => {
  it("every post image has alt text", () => {
    const offenders = readdirSync(POSTS_DIR)
      .filter((fileName) => fileName.endsWith(".md"))
      .flatMap((fileName) =>
        findEmptyAltImages(readFileSync(join(POSTS_DIR, fileName), "utf8")).map(
          (entry) => `${fileName}:${entry.line}`,
        ),
      );
    expect(offenders).toEqual([]);
  });
});
