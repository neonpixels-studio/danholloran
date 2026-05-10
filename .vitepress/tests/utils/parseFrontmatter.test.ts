import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../../utils/parseFrontmatter";

function fm(fields: string, body = "Body content"): string {
  return `---\n${fields}\n---\n${body}`;
}

describe("parseFrontmatter", () => {
  describe("when no frontmatter is present", () => {
    it("returns the raw string as content", () => {
      const raw = "No frontmatter here";
      expect(parseFrontmatter(raw).content).toBe(raw);
    });

    it("returns an empty data object", () => {
      expect(parseFrontmatter("No frontmatter here").data).toEqual({});
    });
  });

  describe("string values", () => {
    it("parses an unquoted string", () => {
      expect(parseFrontmatter(fm("title: Hello World")).data).toMatchObject({
        title: "Hello World",
      });
    });

    it("parses a double-quoted string and strips quotes", () => {
      expect(parseFrontmatter(fm('title: "Hello World"')).data).toMatchObject({
        title: "Hello World",
      });
    });

    it("parses a single-quoted string and strips quotes", () => {
      expect(parseFrontmatter(fm("title: 'Hello World'")).data).toMatchObject({
        title: "Hello World",
      });
    });
  });

  describe("boolean values", () => {
    it("parses true as a boolean", () => {
      expect(parseFrontmatter(fm("draft: true")).data).toMatchObject({
        draft: true,
      });
    });

    it("parses false as a boolean", () => {
      expect(parseFrontmatter(fm("published: false")).data).toMatchObject({
        published: false,
      });
    });

    it('does not coerce "True" (capitalized) to boolean', () => {
      expect(parseFrontmatter(fm("draft: True")).data.draft).toBe("True");
    });
  });

  describe("numeric values", () => {
    it("parses an integer as a number", () => {
      expect(parseFrontmatter(fm("order: 42")).data).toMatchObject({
        order: 42,
      });
    });

    it("parses a float as a number", () => {
      expect(parseFrontmatter(fm("weight: 1.5")).data).toMatchObject({
        weight: 1.5,
      });
    });
  });

  describe("array values", () => {
    it("parses an inline array with unquoted items", () => {
      expect(
        parseFrontmatter(fm("tags: [vue, typescript]")).data,
      ).toMatchObject({
        tags: ["vue", "typescript"],
      });
    });

    it("parses an inline array with double-quoted items", () => {
      expect(
        parseFrontmatter(fm('tags: ["vue", "typescript"]')).data,
      ).toMatchObject({
        tags: ["vue", "typescript"],
      });
    });

    it("parses an inline array with single-quoted items", () => {
      expect(
        parseFrontmatter(fm("tags: ['vue', 'typescript']")).data,
      ).toMatchObject({
        tags: ["vue", "typescript"],
      });
    });
  });

  describe("content extraction", () => {
    it("trims the body content", () => {
      expect(parseFrontmatter(fm("title: Hi", "  trimmed  ")).content).toBe(
        "trimmed",
      );
    });

    it("returns an empty string when there is no body", () => {
      const raw = "---\ntitle: Hi\n---\n";
      expect(parseFrontmatter(raw).content).toBe("");
    });
  });

  describe("line parsing edge cases", () => {
    it("skips lines without a colon", () => {
      const result = parseFrontmatter(
        fm("title: Hello\njust a line\norder: 1"),
      );
      expect(Object.keys(result.data)).toEqual(["title", "order"]);
    });

    it("skips lines where the key is empty", () => {
      const result = parseFrontmatter(fm(": no key"));
      expect(result.data).toEqual({});
    });

    it("uses only the first colon as delimiter for values containing colons", () => {
      // known behavior: "url: https://example.com" → key "url", value "https://example.com"
      // The first colon after "url" splits it; the remaining "//example.com" is the value
      const result = parseFrontmatter(fm("url: https://example.com"));
      expect(result.data.url).toBe("https://example.com");
    });

    it("handles multiple fields in one block", () => {
      const result = parseFrontmatter(
        fm("title: Hello\ndraft: true\norder: 3"),
      );
      expect(result.data).toEqual({ title: "Hello", draft: true, order: 3 });
    });
  });

  describe("line endings", () => {
    it("handles CRLF line endings", () => {
      const raw = "---\r\ntitle: Hello\r\n---\r\nBody";
      const result = parseFrontmatter(raw);
      expect(result.data).toMatchObject({ title: "Hello" });
      expect(result.content).toBe("Body");
    });
  });
});
