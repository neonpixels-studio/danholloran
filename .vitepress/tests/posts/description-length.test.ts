import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_DESCRIPTION_LENGTH,
  isDescriptionTooLong,
  readDescription,
} from "../../theme/utils/postDescriptions";

const POSTS_DIR = join(__dirname, "..", "..", "content", "posts");

describe("readDescription", () => {
  it("reads a quoted description from frontmatter", () => {
    const markdown = '---\ntitle: A\ndescription: "Hello: world"\n---\nBody';
    expect(readDescription(markdown)).toBe("Hello: world");
  });

  it("reads CRLF frontmatter", () => {
    expect(readDescription("---\r\ndescription: Hi\r\n---\r\nBody")).toBe("Hi");
  });

  it("coerces a scalar the way the site renders it", () => {
    expect(readDescription("---\ndescription: 123\n---\nBody")).toBe("123");
  });

  it("returns an empty string when the description is missing", () => {
    expect(readDescription("---\ntitle: A\n---\nBody")).toBe("");
    expect(readDescription("---\ndescription:\n---\nBody")).toBe("");
    expect(readDescription("Body only")).toBe("");
  });
});

describe("isDescriptionTooLong", () => {
  it("allows a description exactly at the limit", () => {
    expect(isDescriptionTooLong("a".repeat(MAX_DESCRIPTION_LENGTH))).toBe(
      false,
    );
  });

  it("flags a description one character over the limit", () => {
    expect(isDescriptionTooLong("a".repeat(MAX_DESCRIPTION_LENGTH + 1))).toBe(
      true,
    );
  });
});

describe("post descriptions", () => {
  function readPostDescription(fileName: string): string {
    const markdown = readFileSync(join(POSTS_DIR, fileName), "utf8");
    try {
      return readDescription(markdown);
    } catch (error) {
      throw new Error(`${fileName}: ${String(error)}`, { cause: error });
    }
  }

  const postDescriptions = readdirSync(POSTS_DIR, { recursive: true })
    .map(String)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => ({
      fileName,
      description: readPostDescription(fileName),
    }));

  it("finds the post files to check", () => {
    expect(postDescriptions.length).toBeGreaterThan(0);
  });

  it("every post has a description", () => {
    const missing = postDescriptions
      .filter((entry) => entry.description === "")
      .map((entry) => entry.fileName);
    expect(missing).toEqual([]);
  });

  it(`every post description is at most ${MAX_DESCRIPTION_LENGTH} characters`, () => {
    const offenders = postDescriptions
      .filter((entry) => isDescriptionTooLong(entry.description))
      .map((entry) => `${entry.fileName} (${entry.description.length})`);
    expect(offenders).toEqual([]);
  });
});
