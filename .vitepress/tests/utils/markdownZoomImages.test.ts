import { describe, it, expect } from "vitest";
import { createMarkdownRenderer } from "vitepress";
import {
  zoomLabelFor,
  countGenericZoomImages,
  setMarkdownZoomImageHints,
  applyMarkdownZoomImageHints,
  type ZoomToken,
} from "../../theme/utils/markdownZoomImages";

// Minimal stand-in for a markdown-it token: attributes as [name, value]
// pairs, plus the type/content/children fields the hint logic walks.
// Mirrors FakeImageToken in markdownImageHints.test.ts, extended so it can
// also stand in for link/image/text siblings.
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

function textToken(content: string): FakeToken {
  return new FakeToken("text", { content });
}

// A fake image token whose alt text is expressed the way markdown-it really
// represents it: as a single text child, not as an `alt` attr (which stays
// an empty placeholder until the base render rule fills it in).
function fakeImage(alt = "", attrs: [string, string][] = []): FakeToken {
  return new FakeToken("image", {
    attrs,
    children: alt ? [textToken(alt)] : [],
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

    expect(countGenericZoomImages(blocks)).toBe(2);
  });

  it("ignores non-inline block tokens and blocks with no children", () => {
    const blocks: ZoomToken[] = [
      new FakeToken("paragraph_open"),
      new FakeToken("inline"),
    ];

    expect(countGenericZoomImages(blocks)).toBe(0);
  });

  it("excludes an image already carrying an aria-label", () => {
    const blocks: ZoomToken[] = [
      new FakeToken("inline", {
        children: [fakeImage("", [["aria-label", "Site map"]]), fakeImage("")],
      }),
    ];

    expect(countGenericZoomImages(blocks)).toBe(1);
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

    expect(countGenericZoomImages(blocks)).toBe(1);
  });
});

describe("setMarkdownZoomImageHints", () => {
  it("marks a lone alt-having image as an operable zoom control", () => {
    const image = fakeImage("Inline diagram", [["src", "/images/posts/a.jpg"]]);
    const env: Record<string, unknown> = { zoomImageGenericTotal: 0 };

    setMarkdownZoomImageHints([image], 0, env);

    expect(image.attrGet("role")).toBe("button");
    expect(image.attrGet("tabindex")).toBe("0");
    expect(image.attrGet("aria-haspopup")).toBe("dialog");
    expect(image.attrGet("aria-label")).toBe("Zoom image: Inline diagram");
  });

  it("assigns stable positional labels to generic images in document order", () => {
    const first = fakeImage("");
    const second = fakeImage("");
    const env: Record<string, unknown> = { zoomImageGenericTotal: 2 };

    setMarkdownZoomImageHints([first, second], 0, env);
    setMarkdownZoomImageHints([first, second], 1, env);

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

    setMarkdownZoomImageHints(siblings, 1, env);

    expect(linkedImage.attrIndex("role")).toBe(-1);
    expect(linkedImage.attrIndex("tabindex")).toBe(-1);
  });

  it("leaves an image that already declares role or tabindex untouched", () => {
    const image = fakeImage("Chart", [["tabindex", "-1"]]);
    const env: Record<string, unknown> = { zoomImageGenericTotal: 0 };

    setMarkdownZoomImageHints([image], 0, env);

    expect(image.attrIndex("role")).toBe(-1);
    expect(image.attrIndex("aria-haspopup")).toBe(-1);
    expect(image.attrGet("tabindex")).toBe("-1");
  });

  it("preserves an author-provided aria-label instead of overwriting it", () => {
    const image = fakeImage("Diagram", [["aria-label", "Custom label"]]);
    const env: Record<string, unknown> = { zoomImageGenericTotal: 0 };

    setMarkdownZoomImageHints([image], 0, env);

    expect(image.attrGet("role")).toBe("button");
    expect(image.attrGet("aria-label")).toBe("Custom label");
  });
});

describe("applyMarkdownZoomImageHints (integration)", () => {
  async function renderWithZoomHints(markdown: string): Promise<string> {
    const md = await createMarkdownRenderer(process.cwd(), {
      config(renderer) {
        applyMarkdownZoomImageHints(renderer);
      },
    });
    return md.render(markdown);
  }

  it("enriches an in-body image rendered through a real VitePress renderer", async () => {
    const html = await renderWithZoomHints("![Inline diagram](/images/a.jpg)");

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-label="Zoom image: Inline diagram"');
  });

  it("numbers multiple generic images across the whole document", async () => {
    const html = await renderWithZoomHints(
      "![](/images/a.jpg)\n\n![](/images/b.jpg)",
    );

    expect(html).toContain('aria-label="Zoom image 1 of 2"');
    expect(html).toContain('aria-label="Zoom image 2 of 2"');
  });

  it("leaves a non-image node (a plain link) untouched", async () => {
    const html = await renderWithZoomHints("[a link](/somewhere)");

    expect(html).not.toContain("role=");
    expect(html).not.toContain("tabindex=");
  });

  it("leaves a linked image without zoom-control attributes", async () => {
    const html = await renderWithZoomHints(
      "[![Linked](/images/a.jpg)](/somewhere)",
    );

    expect(html).not.toContain("role=");
    expect(html).not.toContain("tabindex=");
    expect(html).not.toContain("aria-haspopup=");
  });
});
