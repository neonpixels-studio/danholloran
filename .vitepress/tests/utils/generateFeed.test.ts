import { describe, it, expect, vi, beforeEach } from "vitest";
import { xml2js, type ElementCompact } from "xml-js";
import type { MarkdownRenderer } from "vitepress";

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
import { generateFeed } from "../../theme/utils/generateFeed";
import { SITE_URL } from "../../theme/utils/constants";

const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockParseFrontmatter = vi.mocked(parseFrontmatter);

const XML_DECLARATION = '<?xml version="1.0" encoding="utf-8"?>';

// Registers a post file list and the frontmatter each file resolves to, in
// the same order generateFeed() will read them. `bodies`, when provided,
// supplies the markdown body for each file (defaulting to empty).
function mockPostFiles(
  files: string[],
  frontmatters: Record<string, unknown>[],
  bodies: string[] = [],
): void {
  mockReaddirSync.mockReturnValue(files as any);
  frontmatters.forEach((data, index) => {
    mockParseFrontmatter.mockReturnValueOnce({
      data,
      content: bodies[index] ?? "",
    });
  });
}

// xml-js's `xml2js` throws on real malformed XML (a bare `&` or `<` outside
// an entity/tag, mismatched tags) rather than silently repairing it the way
// a browser-grade DOM parser would, which is what makes it a meaningful
// "does this actually parse" check for RSS output the build writes straight
// to disk.
function parseFeedXml(xml: string): ElementCompact {
  return xml2js(xml, { compact: true }) as ElementCompact;
}

function feedItems(xml: string): ElementCompact[] {
  const items = parseFeedXml(xml).rss.channel.item ?? [];
  return Array.isArray(items) ? items : [items];
}

// A CDATA-wrapped node's text lives under `_cdata`; a plain text node under
// `_text`. The "feed" library uses CDATA for any item title/description. When
// the source text itself contains "]]>", the library splits it across
// multiple adjacent CDATA sections (the only legal way to embed that
// sequence in one), which xml-js then reports as an array under `_cdata` —
// join it back into the original string rather than letting it fall through
// to Array.prototype.toString's comma-separated join.
function nodeText(node: ElementCompact | undefined): string {
  if (!node) {
    return "";
  }
  if (Array.isArray(node._cdata)) {
    return node._cdata.join("");
  }
  return (node._cdata ?? node._text ?? "").toString();
}

function itemTitles(xml: string): string[] {
  return feedItems(xml).map((item) => nodeText(item.title));
}

// The full post body renders into <content:encoded> (feed's `content` field).
function itemContent(item: ElementCompact): string {
  return nodeText(item["content:encoded"]);
}

// A minimal renderer stand-in that skips real markdown-it startup for tests
// asserting feed structure and post-render processing (CDATA/URL handling)
// rather than markdown-to-HTML conversion itself.
function passthroughRenderer(): MarkdownRenderer {
  return { render: (src: string) => src } as unknown as MarkdownRenderer;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockReadFileSync.mockReturnValue("" as any);
});

describe("generateFeed", () => {
  it("produces well-formed, parseable RSS XML", async () => {
    mockPostFiles(["only-post.md"], [{ title: "Hello", date: "2024-01-01" }]);

    const xml = generateFeed(passthroughRenderer());

    expect(xml.startsWith(XML_DECLARATION)).toBe(true);
    expect(() => parseFeedXml(xml)).not.toThrow();
  });

  it("returns a valid feed with no items when there are no posts", async () => {
    mockReaddirSync.mockReturnValue([] as any);

    const xml = generateFeed(passthroughRenderer());

    expect(() => parseFeedXml(xml)).not.toThrow();
    expect(feedItems(xml)).toHaveLength(0);
  });

  it("excludes index.md and non-markdown files from the feed", async () => {
    mockReaddirSync.mockReturnValue([
      "index.md",
      "real-post.md",
      "notes.txt",
    ] as any);
    mockParseFrontmatter.mockReturnValueOnce({
      data: { title: "Real", date: "2024-01-01" },
      content: "",
    });

    generateFeed(passthroughRenderer());

    expect(mockParseFrontmatter).toHaveBeenCalledTimes(1);
    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringContaining("real-post.md"),
      "utf-8",
    );
  });

  it("filters out draft posts", async () => {
    mockPostFiles(
      ["draft.md", "published.md"],
      [
        { title: "Draft", date: "2024-06-01", draft: true },
        { title: "Published", date: "2024-01-01", draft: false },
      ],
    );

    expect(itemTitles(generateFeed(passthroughRenderer()))).toEqual([
      "Published",
    ]);
  });

  it("filters out posts with no date", async () => {
    mockPostFiles(
      ["no-date.md", "dated.md"],
      [{ title: "No Date" }, { title: "Dated", date: "2024-01-01" }],
    );

    expect(itemTitles(generateFeed(passthroughRenderer()))).toEqual(["Dated"]);
  });

  it("filters out posts with an unparseable date and warns about it", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockPostFiles(
      ["bad-date.md", "dated.md"],
      [
        { title: "Bad Date", date: "not-a-real-date" },
        { title: "Dated", date: "2024-01-01" },
      ],
    );

    const xml = generateFeed(passthroughRenderer());

    expect(itemTitles(xml)).toEqual(["Dated"]);
    expect(xml).not.toContain("Invalid Date");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("bad-date"));

    warnSpy.mockRestore();
  });

  it("sorts posts newest first", async () => {
    mockPostFiles(
      ["oldest.md", "newest.md", "middle.md"],
      [
        { title: "Oldest", date: "2023-01-01" },
        { title: "Newest", date: "2024-06-01" },
        { title: "Middle", date: "2024-01-01" },
      ],
    );

    expect(itemTitles(generateFeed(passthroughRenderer()))).toEqual([
      "Newest",
      "Middle",
      "Oldest",
    ]);
  });

  it("preserves input order for posts with identical dates (stable sort)", async () => {
    mockPostFiles(
      ["first.md", "second.md"],
      [
        { title: "First", date: "2024-01-01" },
        { title: "Second", date: "2024-01-01" },
      ],
    );

    expect(itemTitles(generateFeed(passthroughRenderer()))).toEqual([
      "First",
      "Second",
    ]);
  });

  it("escapes special XML characters in the title without corrupting content", async () => {
    const specialTitle = 'A & B <script>alert("x")</script> "quoted"';
    mockPostFiles(
      ["special.md"],
      [{ title: specialTitle, date: "2024-01-01" }],
    );

    const xml = generateFeed(passthroughRenderer());

    expect(() => parseFeedXml(xml)).not.toThrow();
    expect(itemTitles(xml)).toEqual([specialTitle]);
  });

  it("does not let a CDATA-terminator sequence in the title break the document", async () => {
    const title = "Nested ]]> sequence & <em>markup</em>";
    mockPostFiles(["cdata-terminator.md"], [{ title, date: "2024-01-01" }]);

    const xml = generateFeed(passthroughRenderer());

    expect(() => parseFeedXml(xml)).not.toThrow();
    expect(itemTitles(xml)).toEqual([title]);
  });

  it("emits the frontmatter date as the item pubDate", async () => {
    mockPostFiles(["dated.md"], [{ title: "Dated", date: "2024-01-01" }]);

    const pubDate = nodeText(
      feedItems(generateFeed(passthroughRenderer()))[0].pubDate,
    );

    expect(new Date(pubDate).toISOString()).toBe(
      new Date("2024-01-01").toISOString(),
    );
  });

  it("includes the frontmatter description as the item description", async () => {
    mockPostFiles(
      ["described.md"],
      [
        {
          title: "Described",
          date: "2024-01-01",
          description: "A summary & a title",
        },
      ],
    );

    const xml = generateFeed(passthroughRenderer());

    expect(nodeText(feedItems(xml)[0].description)).toBe("A summary & a title");
  });

  it("passes the raw markdown body through the renderer into the item content", () => {
    mockPostFiles(
      ["with-body.md"],
      [{ title: "Bodied", date: "2024-01-01", description: "Summary only" }],
      ["# Heading"],
    );
    const renderer = {
      render: vi.fn((src: string) => `<rendered>${src}</rendered>`),
    } as unknown as MarkdownRenderer;

    const content = itemContent(feedItems(generateFeed(renderer))[0]);

    expect(renderer.render).toHaveBeenCalledWith("# Heading");
    expect(content).toContain("<rendered># Heading</rendered>");
  });

  it("ships the full body as content, distinct from the one-line description", async () => {
    mockPostFiles(
      ["distinct.md"],
      [
        {
          title: "Distinct",
          date: "2024-01-01",
          description: "Just a summary",
        },
      ],
      ["The full article body goes here."],
    );

    const item = feedItems(generateFeed(passthroughRenderer()))[0];

    expect(nodeText(item.description)).toBe("Just a summary");
    expect(itemContent(item)).toContain("The full article body goes here.");
    expect(itemContent(item)).not.toBe("");
  });

  it("omits the content element for a post with an empty body", async () => {
    mockPostFiles(
      ["empty-body.md"],
      [{ title: "Empty", date: "2024-01-01" }],
      [""],
    );

    expect(
      feedItems(generateFeed(passthroughRenderer()))[0]["content:encoded"],
    ).toBeUndefined();
  });

  it("keeps the feed well-formed when the body contains multiple CDATA terminators", async () => {
    mockPostFiles(
      ["cdata-body.md"],
      [{ title: "Raw", date: "2024-01-01" }],
      ["<pre>one ]]> two ]]> three</pre>"],
    );

    const xml = generateFeed(passthroughRenderer());

    expect(() => parseFeedXml(xml)).not.toThrow();
    expect(itemContent(feedItems(xml)[0])).not.toContain("]]>");
  });

  it("rewrites root-relative body URLs to absolute site URLs, leaving protocol-relative URLs alone", async () => {
    mockPostFiles(
      ["links.md"],
      [{ title: "Links", date: "2024-01-01" }],
      [
        '<img src="/images/posts/x.png"> <a href="/posts/y/">y</a> <img src="//cdn.example.com/z.png">',
      ],
    );

    const content = itemContent(
      feedItems(generateFeed(passthroughRenderer()))[0],
    );

    expect(content).toContain(`src="${SITE_URL}/images/posts/x.png"`);
    expect(content).toContain(`href="${SITE_URL}/posts/y/"`);
    expect(content).toContain('src="//cdn.example.com/z.png"');
    expect(content).not.toContain(`${SITE_URL}//cdn.example.com`);
  });

  it("fails loud with the offending slug when rendering a body throws", () => {
    mockPostFiles(
      ["broken.md"],
      [{ title: "Broken", date: "2024-01-01" }],
      ["body"],
    );
    const renderer = {
      render: vi.fn(() => {
        throw new Error("render exploded");
      }),
    } as unknown as MarkdownRenderer;

    expect(() => generateFeed(renderer)).toThrow(/broken/);
  });

  it("builds absolute URLs for post links and guids from the slug", async () => {
    mockPostFiles(["my-cool-post.md"], [{ title: "Cool", date: "2024-01-01" }]);

    const item = feedItems(generateFeed(passthroughRenderer()))[0];
    const expectedUrl = `${SITE_URL}/posts/my-cool-post`;

    expect(nodeText(item.link)).toBe(expectedUrl);
    expect(nodeText(item.guid)).toBe(expectedUrl);
  });

  it("does not crash and omits the title element when frontmatter has no title", async () => {
    mockPostFiles(["untitled.md"], [{ date: "2024-01-01" }]);

    const xml = generateFeed(passthroughRenderer());

    expect(() => parseFeedXml(xml)).not.toThrow();
    expect(feedItems(xml)[0].title).toBeUndefined();
  });
});
