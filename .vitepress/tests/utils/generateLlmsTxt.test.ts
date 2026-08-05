import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("fs", () => {
  const readdirSync = vi.fn();
  const readFileSync = vi.fn();
  return { default: { readdirSync, readFileSync }, readdirSync, readFileSync };
});

vi.mock("../../theme/utils/frontmatter", () => ({
  parseFrontmatter: vi.fn(),
}));

import { readdirSync, readFileSync } from "fs";
import { parseFrontmatter } from "../../theme/utils/frontmatter";
import {
  generateLlmsTxt,
  CAREER_START_YEAR,
} from "../../theme/utils/generateLlmsTxt";
import { SITE_URL } from "../../theme/utils/constants";

const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockParseFrontmatter = vi.mocked(parseFrontmatter);

// Registers a post file list and the frontmatter each file resolves to, in
// the same order generateLlmsTxt() will read them.
function mockPostFiles(
  files: string[],
  frontmatters: Record<string, unknown>[],
): void {
  mockReaddirSync.mockReturnValue(files as any);
  for (const data of frontmatters) {
    mockParseFrontmatter.mockReturnValueOnce({ data, content: "" });
  }
}

// Extracts the `- [title](url)...` list items under a `## <heading>`
// section, stopping at the next `## ` heading or end of document. Splits on
// the literal heading marker rather than building a heading into a RegExp,
// so a heading containing a regex metacharacter can't misbehave.
function sectionItems(output: string, heading: string): string[] {
  const sections = output.split("\n## ");
  const section = sections.find((part) => part.startsWith(`${heading}\n`));
  if (!section) {
    return [];
  }
  return section.split("\n").filter((line) => line.startsWith("- ["));
}

beforeEach(() => {
  vi.resetAllMocks();
  mockReadFileSync.mockReturnValue("" as any);
});

// Safety net for the frozen-clock test below: guarantees real timers are
// restored even if an assertion throws before its own vi.useRealTimers()
// call runs, so a failure there can't cascade into unrelated tests.
afterEach(() => {
  vi.useRealTimers();
});

describe("generateLlmsTxt", () => {
  it("includes the fixed main pages and optional links regardless of posts", () => {
    mockReaddirSync.mockReturnValue([] as any);

    const output = generateLlmsTxt();

    expect(output).toContain("# Dan Holloran");
    expect(output).toContain(
      `- [Home](${SITE_URL}/): Landing page and overview.`,
    );
    expect(output).toContain(
      `- [RSS Feed](${SITE_URL}/feed.xml): Full chronological feed of all posts.`,
    );
  });

  it("computes years of experience from CAREER_START_YEAR against the current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-06-01"));
    mockReaddirSync.mockReturnValue([] as any);

    const output = generateLlmsTxt();

    expect(output).toContain(
      `Dan has ${2030 - CAREER_START_YEAR}+ years of experience`,
    );
  });

  it("produces no topic sections when there are no posts", () => {
    mockReaddirSync.mockReturnValue([] as any);

    const output = generateLlmsTxt();

    expect(output).not.toContain("## Development");
    expect(output).not.toContain("## Obsidian & Productivity");
    expect(output).not.toContain("## Finance");
    expect(output).not.toContain("## Travel & Photography");
  });

  it("excludes draft posts from their topic section", () => {
    mockPostFiles(
      ["draft.md", "published.md"],
      [
        {
          title: "Draft Post",
          date: "2024-06-01",
          topic: "development",
          draft: true,
        },
        {
          title: "Published Post",
          date: "2024-01-01",
          topic: "development",
          draft: false,
        },
      ],
    );

    const output = generateLlmsTxt();

    expect(output).not.toContain("Draft Post");
    expect(sectionItems(output, "Development")).toEqual([
      `- [Published Post](${SITE_URL}/posts/published)`,
    ]);
  });

  it("only renders a topic heading when it has at least one post", () => {
    mockPostFiles(
      ["finance-post.md"],
      [{ title: "Budgeting", date: "2024-01-01", topic: "finance" }],
    );

    const output = generateLlmsTxt();

    expect(output).toContain("## Finance");
    expect(output).not.toContain("## Development");
    expect(output).not.toContain("## Obsidian & Productivity");
    expect(output).not.toContain("## Travel & Photography");
  });

  it("drops posts whose topic matches none of the known sections", () => {
    mockPostFiles(
      ["odd.md"],
      [{ title: "Odd One Out", date: "2024-01-01", topic: "cooking" }],
    );

    const output = generateLlmsTxt();

    expect(output).not.toContain("Odd One Out");
    expect(output).not.toContain("## Cooking");
  });

  it("sorts posts within a topic section newest first", () => {
    mockPostFiles(
      ["oldest.md", "newest.md", "middle.md"],
      [
        { title: "Oldest", date: "2023-01-01", topic: "development" },
        { title: "Newest", date: "2024-06-01", topic: "development" },
        { title: "Middle", date: "2024-01-01", topic: "development" },
      ],
    );

    const output = generateLlmsTxt();

    expect(sectionItems(output, "Development")).toEqual([
      `- [Newest](${SITE_URL}/posts/newest)`,
      `- [Middle](${SITE_URL}/posts/middle)`,
      `- [Oldest](${SITE_URL}/posts/oldest)`,
    ]);
  });

  it("sorts undated posts to the end, after dated posts", () => {
    mockPostFiles(
      ["undated.md", "dated.md"],
      [
        { title: "Undated", topic: "travel" },
        { title: "Dated", date: "2024-01-01", topic: "travel" },
      ],
    );

    const output = generateLlmsTxt();

    expect(sectionItems(output, "Travel & Photography")).toEqual([
      `- [Dated](${SITE_URL}/posts/dated)`,
      `- [Undated](${SITE_URL}/posts/undated)`,
    ]);
  });

  it("sorts posts with an unparseable date to the end and warns about it", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockPostFiles(
      ["bad-date.md", "dated.md"],
      [
        { title: "Bad Date", date: "not-a-real-date", topic: "travel" },
        { title: "Dated", date: "2024-01-01", topic: "travel" },
      ],
    );

    const output = generateLlmsTxt();

    expect(sectionItems(output, "Travel & Photography")).toEqual([
      `- [Dated](${SITE_URL}/posts/dated)`,
      `- [Bad Date](${SITE_URL}/posts/bad-date)`,
    ]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("bad-date"));

    warnSpy.mockRestore();
  });

  it("preserves input order among a mix of undated and unparseable-date posts", () => {
    mockPostFiles(
      ["undated.md", "bad-date.md"],
      [
        { title: "Undated", topic: "travel" },
        { title: "Bad Date", date: "not-a-real-date", topic: "travel" },
      ],
    );

    const output = generateLlmsTxt();

    expect(sectionItems(output, "Travel & Photography")).toEqual([
      `- [Undated](${SITE_URL}/posts/undated)`,
      `- [Bad Date](${SITE_URL}/posts/bad-date)`,
    ]);
  });

  it("preserves input order for posts with identical dates (stable sort)", () => {
    mockPostFiles(
      ["first.md", "second.md"],
      [
        { title: "First", date: "2024-01-01", topic: "obsidian" },
        { title: "Second", date: "2024-01-01", topic: "obsidian" },
      ],
    );

    const output = generateLlmsTxt();

    expect(sectionItems(output, "Obsidian & Productivity")).toEqual([
      `- [First](${SITE_URL}/posts/first)`,
      `- [Second](${SITE_URL}/posts/second)`,
    ]);
  });

  it("appends the description when present, and omits it when absent", () => {
    mockPostFiles(
      ["with-desc.md", "without-desc.md"],
      [
        {
          title: "With Description",
          date: "2024-06-01",
          topic: "development",
          description: "A short summary",
        },
        {
          title: "Without Description",
          date: "2024-01-01",
          topic: "development",
        },
      ],
    );

    const output = generateLlmsTxt();

    expect(sectionItems(output, "Development")).toEqual([
      `- [With Description](${SITE_URL}/posts/with-desc): A short summary`,
      `- [Without Description](${SITE_URL}/posts/without-desc)`,
    ]);
  });

  it("builds absolute post URLs from the file slug", () => {
    mockPostFiles(
      ["my-cool-post.md"],
      [{ title: "Cool", date: "2024-01-01", topic: "development" }],
    );

    const output = generateLlmsTxt();

    expect(output).toContain(`(${SITE_URL}/posts/my-cool-post)`);
  });

  // postLine() interpolates the title straight into `- [title](url)` with no
  // markdown escaping, so a title containing `]` breaks the link syntax.
  // This pins today's (imperfect) output as a known limitation rather than
  // silently drifting; fixing the escaping is tracked separately, not part
  // of this test-coverage pass.
  it("does not escape markdown-significant characters in the title (known limitation)", () => {
    mockPostFiles(
      ["brackets.md"],
      [
        {
          title: "Using [] in TypeScript",
          date: "2024-01-01",
          topic: "development",
        },
      ],
    );

    const output = generateLlmsTxt();

    expect(sectionItems(output, "Development")).toEqual([
      `- [Using [] in TypeScript](${SITE_URL}/posts/brackets)`,
    ]);
  });

  it("excludes index.md and non-markdown files", () => {
    mockReaddirSync.mockReturnValue([
      "index.md",
      "real-post.md",
      "notes.txt",
    ] as any);
    mockParseFrontmatter.mockReturnValueOnce({
      data: { title: "Real", date: "2024-01-01", topic: "development" },
      content: "",
    });

    generateLlmsTxt();

    expect(mockParseFrontmatter).toHaveBeenCalledTimes(1);
    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringContaining("real-post.md"),
      "utf-8",
    );
  });

  it("does not crash on a post with no frontmatter fields at all", () => {
    mockPostFiles(["empty.md"], [{}]);

    let output = "";
    expect(() => {
      output = generateLlmsTxt();
    }).not.toThrow();
    expect(output).not.toContain("## Development");
    expect(output).not.toContain("## Obsidian & Productivity");
    expect(output).not.toContain("## Finance");
    expect(output).not.toContain("## Travel & Photography");
  });
});
