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
  const postFiles = readdirSync(POSTS_DIR, { recursive: true })
    .map(String)
    .filter((fileName) => fileName.endsWith(".md"));

  it("finds the post files to check", () => {
    expect(postFiles.length).toBeGreaterThan(0);
  });

  it(`every post description is at most ${MAX_DESCRIPTION_LENGTH} characters`, () => {
    const offenders = postFiles
      .map((fileName) => ({
        fileName,
        description: readDescription(
          readFileSync(join(POSTS_DIR, fileName), "utf8"),
        ),
      }))
      .filter((entry) => isDescriptionTooLong(entry.description))
      .map((entry) => `${entry.fileName} (${entry.description?.length})`);
    expect(offenders).toEqual([]);
  });
});
