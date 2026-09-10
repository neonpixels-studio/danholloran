import { describe, it, expect } from "vitest";
import { createMarkdownRenderer, disposeMdItInstance } from "vitepress";
import {
  zoomLabelFor,
  countGenericZoomImages,
  setMarkdownZoomImageHints,
  applyMarkdownZoomImageHints,
  type ZoomToken,
  type AltTextResolver,
} from "../../theme/utils/markdownZoomImages";
import {
  applyMarkdownImageHints,
  readLocalImageDimensions,
} from "../../theme/utils/markdownImageHints";

// Minimal stand-in for a markdown-it token: attributes as [name, value]
// pairs, plus the type/content/children fields the hint logic walks.
// Mirrors FakeImageToken in markdownImageHints.test.ts, extended so it can
// also stand in for link/image/html_inline siblings.
class FakeToken implements ZoomToken {
  type: string;
  content: string;
  children: ZoomToken[] | null;
  attrs: [string, string][];

  constructor(
    type: string,
    options: {
      attrs?: [string, string][];
      content?: string;
      children?: ZoomToken[] | null;
    } = {},
  ) {
    this.type = type;
    this.attrs = options.attrs ?? [];
    this.content = options.content ?? "";
    this.children = options.children ?? null;
  }

  attrIndex(name: string): number {
    return this.attrs.findIndex(([attrName]) => attrName === name);
  }

  attrGet(name: string): string | null {
    const found = this.attrs.find(([attrName]) => attrName === name);
    return found ? found[1] : null;
  }

  attrSet(name: string, value: string): void {
    const index = this.attrIndex(name);
    if (index >= 0) {
      this.attrs[index][1] = value;
      return;
    }
    this.attrs.push([name, value]);
  }
}

// Unit-level tests operate below the real markdown-it renderer, so alt text
// is expressed directly via a trivial resolver reading each fake image's own
// `content` field rather than replicating markdown-it's children-walking.
const resolveFakeAlt: AltTextResolver = (children) =>
  children?.[0]?.content ?? "";

function fakeImage(alt = "", attrs: [string, string][] = []): FakeToken {
  return new FakeToken("image", {
    attrs,
    children: alt ? [new FakeToken("text", { content: alt })] : [],
  });
}

describe("zoomLabelFor", () => {
  it("prefixes the alt text when the image has one", () => {
    expect(zoomLabelFor("Inline diagram")).toBe("Zoom image: Inline diagram");
  });

  it("falls back to the generic label with no position/total", () => {
    expect(zoomLabelFor("")).toBe("Zoom image");
  });

  it("numbers a generic image among multiple generic siblings", () => {
    expect(zoomLabelFor("", 1, 2)).toBe("Zoom image 1 of 2");
    expect(zoomLabelFor("", 2, 2)).toBe("Zoom image 2 of 2");
  });

  it("does not number a lone generic image", () => {
    expect(zoomLabelFor("", 1, 1)).toBe("Zoom image");
  });
});

describe("countGenericZoomImages", () => {
  it("counts alt-less, unlabeled images across inline blocks", () => {
    const blocks: ZoomToken[] = [
      new FakeToken("inline", { children: [fakeImage("")] }),
      new FakeToken("inline", {
        children: [fakeImage("Chart"), fakeImage("")],
      }),
    ];

    expect(countGenericZoomImages(blocks, resolveFakeAlt)).toBe(2);
  });

  it("ignores non-inline block tokens and blocks with no children", () => {
    const blocks: ZoomToken[] = [
      new FakeToken("paragraph_open"),
      new FakeToken("inline"),
    ];

    expect(countGenericZoomImages(blocks, resolveFakeAlt)).toBe(0);
  });

  it("excludes an image already carrying an aria-label", () => {
    const blocks: ZoomToken[] = [
      new FakeToken("inline", {
        children: [fakeImage("", [["aria-label", "Site map"]]), fakeImage("")],
      }),
    ];

    expect(countGenericZoomImages(blocks, resolveFakeAlt)).toBe(1);
  });

  it("excludes an image already carrying an author-declared role or tabindex", () => {
    // Reachable via markdown-it-attrs (VitePress's default), e.g.
    // `![](/a.png){tabindex="-1"}`. If this image still consumed a position
    // slot, the remaining generic image would be mislabeled "2 of 2" when
    // it's the only real control on the page.
    const blocks: ZoomToken[] = [
      new FakeToken("inline", {
        children: [fakeImage("", [["tabindex", "-1"]]), fakeImage("")],
      }),
    ];

    expect(countGenericZoomImages(blocks, resolveFakeAlt)).toBe(1);
  });

  it("excludes an image wrapped in a link", () => {
    const linkedImage = fakeImage("");
    const siblings = [
      new FakeToken("link_open"),
      linkedImage,
      new FakeToken("link_close"),
      fakeImage(""),
    ];
    const blocks: ZoomToken[] = [
      new FakeToken("inline", { children: siblings }),
    ];

    expect(countGenericZoomImages(blocks, resolveFakeAlt)).toBe(1);
  });

  it("excludes an image wrapped in a raw HTML anchor", () => {
    const linkedImage = fakeImage("");
    const siblings = [
      new FakeToken("html_inline", { content: '<a href="/x">' }),
      linkedImage,
      new FakeToken("html_inline", { content: "</a>" }),
      fakeImage(""),
    ];
    const blocks: ZoomToken[] = [
      new FakeToken("inline", { children: siblings }),
    ];

    expect(countGenericZoomImages(blocks, resolveFakeAlt)).toBe(1);
  });
});

describe("setMarkdownZoomImageHints", () => {
  it("marks a lone alt-having image as an operable zoom control", () => {
    const image = fakeImage("Inline diagram", [["src", "/images/posts/a.jpg"]]);
    const env: Record<string, unknown> = { zoomImageGenericTotal: 0 };

    setMarkdownZoomImageHints([image], 0, env, resolveFakeAlt);

    expect(image.attrGet("role")).toBe("button");
    expect(image.attrGet("tabindex")).toBe("0");
    expect(image.attrGet("aria-haspopup")).toBe("dialog");
    expect(image.attrGet("aria-label")).toBe("Zoom image: Inline diagram");
  });

  it("assigns stable positional labels to generic images in document order", () => {
    const first = fakeImage("");
    const second = fakeImage("");
    const env: Record<string, unknown> = { zoomImageGenericTotal: 2 };

    setMarkdownZoomImageHints([first, second], 0, env, resolveFakeAlt);
    setMarkdownZoomImageHints([first, second], 1, env, resolveFakeAlt);

    expect(first.attrGet("aria-label")).toBe("Zoom image 1 of 2");
    expect(second.attrGet("aria-label")).toBe("Zoom image 2 of 2");
  });

  it("does not enrich an image wrapped in a link", () => {
    const linkedImage = fakeImage("Linked");
    const siblings = [
      new FakeToken("link_open"),
      linkedImage,
      new FakeToken("link_close"),
    ];
    const env: Record<string, unknown> = { zoomImageGenericTotal: 0 };

    setMarkdownZoomImageHints(siblings, 1, env, resolveFakeAlt);

    expect(linkedImage.attrIndex("role")).toBe(-1);
    expect(linkedImage.attrIndex("tabindex")).toBe(-1);
  });

  it("does not enrich an image wrapped in a raw HTML anchor", () => {
    const linkedImage = fakeImage("Linked");
    const siblings = [
      new FakeToken("html_inline", { content: '<a href="/x">' }),
      linkedImage,
      new FakeToken("html_inline", { content: "</a>" }),
    ];
    const env: Record<string, unknown> = { zoomImageGenericTotal: 0 };

    setMarkdownZoomImageHints(siblings, 1, env, resolveFakeAlt);

    expect(linkedImage.attrIndex("role")).toBe(-1);
    expect(linkedImage.attrIndex("tabindex")).toBe(-1);
  });

  it("leaves an image that already declares role or tabindex untouched", () => {
    const image = fakeImage("Chart", [["tabindex", "-1"]]);
    const env: Record<string, unknown> = { zoomImageGenericTotal: 0 };

    setMarkdownZoomImageHints([image], 0, env, resolveFakeAlt);

    expect(image.attrIndex("role")).toBe(-1);
    expect(image.attrIndex("aria-haspopup")).toBe(-1);
    expect(image.attrGet("tabindex")).toBe("-1");
  });

  it("preserves an author-provided aria-label instead of overwriting it", () => {
    const image = fakeImage("Diagram", [["aria-label", "Custom label"]]);
    const env: Record<string, unknown> = { zoomImageGenericTotal: 0 };

    setMarkdownZoomImageHints([image], 0, env, resolveFakeAlt);

    expect(image.attrGet("role")).toBe("button");
    expect(image.attrGet("aria-label")).toBe("Custom label");
  });
});

describe("applyMarkdownZoomImageHints (integration)", () => {
  const POST_FRONTMATTER = 'topic: development\ndate: "2025-01-01"';

  async function renderWithZoomHints(
    markdown: string,
    { withDimensionHints = false } = {},
  ): Promise<string> {
    // createMarkdownRenderer caches a single markdown-it instance for the
    // whole process (it ignores its arguments once one exists), so without
    // disposing it first, a later test in this file would silently reuse an
    // earlier test's config instead of the one just passed in.
    disposeMdItInstance();
    const md = await createMarkdownRenderer(process.cwd(), {
      config(renderer) {
        if (withDimensionHints) {
          applyMarkdownImageHints(renderer, readLocalImageDimensions);
        }
        applyMarkdownZoomImageHints(renderer);
      },
    });
    return md.render(markdown);
  }

  function asPost(body: string): string {
    return `---\n${POST_FRONTMATTER}\n---\n\n${body}\n`;
  }

  it("enriches an in-body image in a post document", async () => {
    const html = await renderWithZoomHints(
      asPost("![Inline diagram](/images/a.jpg)"),
    );

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-label="Zoom image: Inline diagram"');
  });

  it("leaves an image in a non-post document untouched", async () => {
    // No frontmatter at all — matches index.md/resume.md/themes/*.md, which
    // have no click/keydown handler ready to open a lightbox.
    const html = await renderWithZoomHints("![Inline diagram](/images/a.jpg)");

    expect(html).not.toContain("role=");
    expect(html).not.toContain("tabindex=");
    expect(html).not.toContain("aria-haspopup=");
  });

  it("leaves an image in a document with unrelated frontmatter untouched", async () => {
    const html = await renderWithZoomHints(
      `---\ntitle: Not a post\n---\n\n![Inline diagram](/images/a.jpg)\n`,
    );

    expect(html).not.toContain("role=");
  });

  it("numbers multiple generic images across the whole post", async () => {
    const html = await renderWithZoomHints(
      asPost("![](/images/a.jpg)\n\n![](/images/b.jpg)"),
    );

    expect(html).toContain('aria-label="Zoom image 1 of 2"');
    expect(html).toContain('aria-label="Zoom image 2 of 2"');
  });

  it("does not let a linked generic image inflate positional counts", async () => {
    const html = await renderWithZoomHints(
      asPost("[![](/images/a.jpg)](/somewhere)\n\n![](/images/b.jpg)"),
    );

    // Only one real generic control exists (the linked image is excluded
    // entirely), so it must not claim "1 of 2".
    expect(html).toContain('aria-label="Zoom image"');
    expect(html).not.toContain("1 of 2");
  });

  it("labels a mixed alt/generic set so the generic image is not falsely numbered", async () => {
    const html = await renderWithZoomHints(
      asPost("![Chart](/images/a.jpg)\n\n![](/images/b.jpg)"),
    );

    expect(html).toContain('aria-label="Zoom image: Chart"');
    expect(html).toContain('aria-label="Zoom image"');
    expect(html).not.toContain("of 2");
  });

  it("leaves a non-image node (a plain link) untouched", async () => {
    const html = await renderWithZoomHints(asPost("[a link](/somewhere)"));

    expect(html).not.toContain("role=");
    expect(html).not.toContain("tabindex=");
  });

  it("leaves a linked image without zoom-control attributes", async () => {
    const html = await renderWithZoomHints(
      asPost("[![Linked](/images/a.jpg)](/somewhere)"),
    );

    expect(html).not.toContain("role=");
    expect(html).not.toContain("tabindex=");
    expect(html).not.toContain("aria-haspopup=");
  });

  it("leaves an image wrapped in a raw HTML anchor without zoom-control attributes", async () => {
    const html = await renderWithZoomHints(
      asPost('<a href="/somewhere">![Linked](/images/a.jpg)</a>'),
    );

    expect(html).not.toContain("role=");
    expect(html).not.toContain("tabindex=");
  });

  it("both sets of attributes land regardless of plugin registration order", async () => {
    const html = await renderWithZoomHints(
      asPost("![Inline diagram](/images/default-social.png)"),
      { withDimensionHints: true },
    );

    expect(html).toContain('role="button"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('width="1200"');
  });
});
