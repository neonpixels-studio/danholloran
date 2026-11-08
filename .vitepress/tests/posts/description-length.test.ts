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

  it("returns undefined when there is no description or frontmatter", () => {
    expect(readDescription("---\ntitle: A\n---\nBody")).toBeUndefined();
    expect(readDescription("Body only")).toBeUndefined();
    expect(readDescription("---\ndescription: 123\n---\nBody")).toBeUndefined();
    expect(readDescription("---\ndescription:\n---\nBody")).toBeUndefined();
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

  it("does not flag a missing description", () => {
    expect(isDescriptionTooLong(undefined)).toBe(false);
  });
});

describe("post descriptions", () => {
  function readPostDescription(fileName: string): string | undefined {
    const markdown = readFileSync(join(POSTS_DIR, fileName), "utf8");
    try {
      return readDescription(markdown);
    } catch (error) {
      throw new Error(`${fileName}: ${(error as Error).message}`);
    }
  }

  const postFiles = readdirSync(POSTS_DIR, { recursive: true })
    .map(String)
    .filter((fileName) => fileName.endsWith(".md"));

  it("finds the post files to check", () => {
    expect(postFiles.length).toBeGreaterThan(0);
  });

  it("every post has a readable description", () => {
    const missing = postFiles.filter(
      (fileName) => readPostDescription(fileName) === undefined,
    );
    expect(missing).toEqual([]);
  });

  it(`every post description is at most ${MAX_DESCRIPTION_LENGTH} characters`, () => {
    const offenders = postFiles
      .map((fileName) => ({
        fileName,
        description: readPostDescription(fileName),
      }))
      .filter((entry) => isDescriptionTooLong(entry.description))
      .map((entry) => `${entry.fileName} (${entry.description?.length})`);
    expect(offenders).toEqual([]);
  });
});
