import { describe, it, expect, vi } from "vitest";
import { createMarkdownRenderer } from "vitepress";
import {
  setMarkdownImageHints,
  applyMarkdownImageHints,
  readLocalImageDimensions,
  orientedDimensions,
  type ImageDimensionReader,
  type ImageToken,
} from "../../theme/utils/markdownImageHints";

// Minimal stand-in for a markdown-it image token: attributes as [name, value]
// pairs, exposing only the attr* methods the hint logic uses.
class FakeImageToken implements ImageToken {
  attrs: [string, string][];

  constructor(attrs: [string, string][] = []) {
    this.attrs = attrs;
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

const measure10x20: ImageDimensionReader = () => ({ width: 10, height: 20 });
const unmeasurable: ImageDimensionReader = () => null;

describe("setMarkdownImageHints", () => {
  it("adds loading, decoding, and intrinsic dimensions to a bare image", () => {
    const token = new FakeImageToken([["src", "/images/posts/a.jpg"]]);

    setMarkdownImageHints(token, measure10x20);

    expect(token.attrGet("loading")).toBe("lazy");
    expect(token.attrGet("decoding")).toBe("async");
    expect(token.attrGet("width")).toBe("10");
    expect(token.attrGet("height")).toBe("20");
  });

  it("does not override an author-declared loading value", () => {
    const token = new FakeImageToken([
      ["src", "/images/posts/a.jpg"],
      ["loading", "eager"],
    ]);

    setMarkdownImageHints(token, measure10x20);

    expect(token.attrGet("loading")).toBe("eager");
  });

  it("does not override an author-declared decoding value", () => {
    const token = new FakeImageToken([
      ["src", "/images/posts/a.jpg"],
      ["decoding", "sync"],
    ]);

    setMarkdownImageHints(token, measure10x20);

    expect(token.attrGet("decoding")).toBe("sync");
  });

  it("leaves dimensions alone when the author already sized the image", () => {
    const token = new FakeImageToken([
      ["src", "/images/posts/a.jpg"],
      ["width", "640"],
      ["height", "480"],
    ]);

    setMarkdownImageHints(token, measure10x20);

    expect(token.attrGet("width")).toBe("640");
    expect(token.attrGet("height")).toBe("480");
  });

  it("skips dimensions when the image cannot be measured", () => {
    const token = new FakeImageToken([["src", "/images/posts/a.jpg"]]);

    setMarkdownImageHints(token, unmeasurable);

    expect(token.attrIndex("width")).toBe(-1);
    expect(token.attrIndex("height")).toBe(-1);
    // The loading/decoding hints still apply.
    expect(token.attrGet("loading")).toBe("lazy");
  });

  it("skips dimensions when the token has no src", () => {
    const token = new FakeImageToken([]);

    setMarkdownImageHints(token, measure10x20);

    expect(token.attrIndex("width")).toBe(-1);
  });
});

describe("applyMarkdownImageHints", () => {
  it("hints the token then delegates to the existing image rule with all args", () => {
    const renderImage = vi.fn((..._args: unknown[]) => "<rendered>");
    const md = { renderer: { rules: { image: renderImage } } };

    applyMarkdownImageHints(md as never, measure10x20);

    const tokens = [new FakeImageToken([["src", "/images/posts/a.jpg"]])];
    const options = { sentinel: "options" };
    const env = { sentinel: "env" };
    const self = { sentinel: "self" };
    const output = md.renderer.rules.image(
      tokens,
      0,
      options as never,
      env as never,
      self as never,
    );

    expect(output).toBe("<rendered>");
    // Every argument is forwarded so VitePress's own image rule keeps working.
    expect(renderImage).toHaveBeenCalledWith(tokens, 0, options, env, self);
    expect(tokens[0].attrGet("loading")).toBe("lazy");
    expect(tokens[0].attrGet("width")).toBe("10");
  });
});

describe("orientedDimensions", () => {
  it("keeps width and height for an upright or missing orientation", () => {
    expect(orientedDimensions(1200, 630, 1)).toEqual({
      width: 1200,
      height: 630,
    });
    expect(orientedDimensions(1200, 630, undefined)).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it("swaps width and height across the whole rotated range (5-8)", () => {
    for (const orientation of [5, 6, 7, 8]) {
      expect(orientedDimensions(4032, 3024, orientation)).toEqual({
        width: 3024,
        height: 4032,
      });
    }
  });

  it("does not swap for mirrored-but-upright orientations (2-4)", () => {
    for (const orientation of [2, 3, 4]) {
      expect(orientedDimensions(1200, 630, orientation)).toEqual({
        width: 1200,
        height: 630,
      });
    }
  });

  it("does not swap for an out-of-range (corrupt) orientation", () => {
    expect(orientedDimensions(1200, 630, 9)).toEqual({
      width: 1200,
      height: 630,
    });
  });
});

describe("readLocalImageDimensions", () => {
  it("returns null for a remote url instead of touching the filesystem", () => {
    expect(readLocalImageDimensions("https://cdn.example/a.jpg")).toBeNull();
  });

  it("returns null for a protocol-relative url", () => {
    expect(readLocalImageDimensions("//cdn.example/a.jpg")).toBeNull();
  });

  it("returns null for a malformed percent-escape instead of throwing", () => {
    expect(readLocalImageDimensions("/images/posts/%zz.png")).toBeNull();
  });

  it("warns and returns null for a path that escapes public/", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(readLocalImageDimensions("/../secrets/logo.png")).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("resolves outside public/"),
    );

    warn.mockRestore();
  });

  it("rejects percent-encoded traversal after decoding", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      readLocalImageDimensions("/images/%2e%2e/%2e%2e/package.json"),
    ).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("resolves outside public/"),
    );

    warn.mockRestore();
  });

  it("returns null for a directory-style src without attempting a read", () => {
    expect(readLocalImageDimensions("/images/posts/")).toBeNull();
  });

  it("warns and returns null for a missing local file", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      readLocalImageDimensions("/images/posts/does-not-exist.jpg"),
    ).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("could not measure"),
    );

    warn.mockRestore();
  });

  it("measures a real public image, ignoring a cache-busting query string", () => {
    // default-social.png (1200x675) is referenced from pageTransform, so it is
    // a stable non-square site asset — exact values catch a width/height swap.
    const dimensions = readLocalImageDimensions(
      "/images/default-social.png?v=1",
    );

    expect(dimensions).toEqual({ width: 1200, height: 675 });
  });
});

describe("applyMarkdownImageHints (integration)", () => {
  it("hints images rendered through a real VitePress markdown renderer", async () => {
    const md = await createMarkdownRenderer(process.cwd(), {
      config(renderer) {
        applyMarkdownImageHints(renderer, readLocalImageDimensions);
      },
    });

    const html = md.render("![alt](/images/default-social.png)");

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('width="1200"');
    expect(html).toContain('height="675"');
  });
});
