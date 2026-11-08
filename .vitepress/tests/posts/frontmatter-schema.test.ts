import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "../../theme/utils/frontmatter";
import { TOPIC_SECTIONS } from "../../theme/utils/generateLlmsTxt";
import {
  KNOWN_TOPICS,
  validatePostFrontmatter,
} from "../../theme/utils/validatePostFrontmatter";

const POSTS_DIR = join(__dirname, "..", "..", "content", "posts");
const PUBLIC_DIR = join(__dirname, "..", "..", "..", "public");
const INDEX_FILE = "index.md";

const validFrontmatter = {
  title: "A post",
  description: "About a thing",
  date: "2026-06-11T07:09:22.000+00:00",
  image: "/images/posts/a.jpg",
  topic: "development",
  tags: [],
  draft: false,
};

describe("validatePostFrontmatter", () => {
  it("accepts a complete post, with and without optional keys", () => {
    expect(validatePostFrontmatter(validFrontmatter)).toEqual([]);
    expect(
      validatePostFrontmatter({
        ...validFrontmatter,
        alert_message: "Heads up",
        canonical: "other-post",
        travel_location: "zion national park",
        created_at: "2025-05-22T09:00:00.000-06:00",
      }),
    ).toEqual([]);
  });

  it("derives the topic set from the llms.txt sections", () => {
    expect(KNOWN_TOPICS).toEqual(
      TOPIC_SECTIONS.map((section) => section.topic),
    );
  });

  it.each(["", "   "])("rejects an empty created_at %j", (created_at) => {
    expect(
      validatePostFrontmatter({ ...validFrontmatter, created_at }),
    ).toEqual([expect.stringContaining('"created_at"')]);
  });

  it.each(["title", "description", "date", "image", "topic", "tags", "draft"])(
    "rejects a missing %s",
    (key) => {
      const { [key]: _removed, ...rest } = validFrontmatter as Record<
        string,
        unknown
      >;
      const problems = validatePostFrontmatter(rest);
      expect(problems.some((problem) => problem.includes(`"${key}"`))).toBe(
        true,
      );
    },
  );

  it("rejects a topic outside the known set", () => {
    expect(
      validatePostFrontmatter({ ...validFrontmatter, topic: "devlopment" }),
    ).toEqual([expect.stringContaining('"topic"')]);
  });

  it("rejects a non-string topic with a single problem", () => {
    expect(validatePostFrontmatter({ ...validFrontmatter, topic: 5 })).toEqual([
      expect.stringContaining('"topic"'),
    ]);
  });

  it.each(["a string", ["a"], null])(
    "rejects non-mapping frontmatter %j",
    (data) => {
      expect(validatePostFrontmatter(data as never)).toEqual([
        "frontmatter must be a YAML mapping",
      ]);
    },
  );

  it.each(["images/a.jpg", "https://example.com/a.jpg"])(
    "rejects the non-root-relative image %s",
    (image) => {
      expect(validatePostFrontmatter({ ...validFrontmatter, image })).toEqual([
        expect.stringContaining('"image"'),
      ]);
    },
  );

  it("rejects a whitespace-only title", () => {
    expect(
      validatePostFrontmatter({ ...validFrontmatter, title: "   " }),
    ).toEqual([expect.stringContaining('"title"')]);
  });

  it.each(["not a date", "Jan 5", "1", "2026-06-11", "2026-02-30T00:00:00Z"])(
    "rejects the non-ISO date %s",
    (date) => {
      expect(validatePostFrontmatter({ ...validFrontmatter, date })).toEqual([
        expect.stringContaining('"date"'),
      ]);
    },
  );

  it("rejects an invalid created_at", () => {
    expect(
      validatePostFrontmatter({ ...validFrontmatter, created_at: "yesterday" }),
    ).toEqual([expect.stringContaining('"created_at"')]);
  });

  it("rejects wrongly typed tags and draft", () => {
    expect(
      validatePostFrontmatter({
        ...validFrontmatter,
        tags: "a, b",
        draft: "false",
      }),
    ).toEqual([
      expect.stringContaining('"tags"'),
      expect.stringContaining('"draft"'),
    ]);
  });

  it("rejects a tag list containing a non-string", () => {
    expect(
      validatePostFrontmatter({ ...validFrontmatter, tags: ["a", 1] }),
    ).toEqual([expect.stringContaining('"tags"')]);
  });

  it("rejects unknown and typo'd keys", () => {
    expect(
      validatePostFrontmatter({ ...validFrontmatter, descripton: "typo" }),
    ).toEqual(['unknown key "descripton"']);
  });

  it("rejects a non-string optional field", () => {
    expect(
      validatePostFrontmatter({ ...validFrontmatter, alert_message: 5 }),
    ).toEqual([expect.stringContaining('"alert_message"')]);
  });
});

function parsePost(fileName: string): {
  fileName: string;
  data: Record<string, unknown>;
  parseError?: string;
} {
  try {
    const raw = readFileSync(join(POSTS_DIR, fileName), "utf8");
    return { fileName, data: parseFrontmatter(raw).data };
  } catch (error) {
    return { fileName, data: {}, parseError: String(error) };
  }
}

describe("post frontmatter schema", () => {
  const postFiles = readdirSync(POSTS_DIR)
    .filter((fileName) => fileName.endsWith(".md") && fileName !== INDEX_FILE)
    .sort();
  const parsedPosts = postFiles.map(parsePost);

  it("finds the post files to check", () => {
    expect(postFiles.length).toBeGreaterThan(0);
  });

  it("every post's frontmatter parses as YAML", () => {
    const offenders = parsedPosts
      .filter(({ parseError }) => parseError)
      .map(({ fileName, parseError }) => `${fileName}: ${parseError}`);
    expect(offenders).toEqual([]);
  });

  it("every post matches the frontmatter schema", () => {
    const offenders = parsedPosts.flatMap(({ fileName, data }) =>
      validatePostFrontmatter(data).map((problem) => `${fileName}: ${problem}`),
    );
    expect(offenders).toEqual([]);
  });

  it("every post image exists under public/", () => {
    const offenders = parsedPosts
      .filter(({ data }) => typeof data.image === "string")
      .filter(({ data }) => !existsSync(join(PUBLIC_DIR, data.image as string)))
      .map(({ fileName, data }) => `${fileName}: ${data.image}`);
    expect(offenders).toEqual([]);
  });

  it("every canonical points at an existing post", () => {
    const slugs = new Set(postFiles.map((fileName) => fileName.slice(0, -3)));
    const offenders = parsedPosts
      .filter(({ data }) => typeof data.canonical === "string")
      .filter(({ data }) => !slugs.has(data.canonical as string))
      .map(({ fileName, data }) => `${fileName}: ${data.canonical}`);
    expect(offenders).toEqual([]);
  });
});
