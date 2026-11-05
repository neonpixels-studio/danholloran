import { describe, it, expect } from "vitest";
import {
  assertIconsStylesheetEmpty,
  removeIconsStylesheetLink,
} from "@utils/iconsStylesheet";

const VITEPRESS_HEAD = `<head>
    <link rel="stylesheet" href="/assets/style.abc123.css">
    <link rel="preload stylesheet" href="/vp-icons.css" as="style">
    <script type="module" src="/assets/app.js"></script>
  </head>`;

describe("removeIconsStylesheetLink", () => {
  it("drops the vp-icons.css link and keeps the rest of the head", () => {
    const html = removeIconsStylesheetLink(VITEPRESS_HEAD);

    expect(html).not.toContain("vp-icons.css");
    expect(html).toContain('href="/assets/style.abc123.css"');
    expect(html).toContain('src="/assets/app.js"');
  });

  it("throws when the VitePress link is missing so a template change is noticed", () => {
    expect(() =>
      removeIconsStylesheetLink("<head><title>x</title></head>"),
    ).toThrow(/vp-icons\.css/);
  });
});

describe("assertIconsStylesheetEmpty", () => {
  it("accepts an empty or whitespace-only stylesheet", () => {
    expect(() => assertIconsStylesheetEmpty("")).not.toThrow();
    expect(() => assertIconsStylesheetEmpty("\n  \n")).not.toThrow();
  });

  it("throws once VitePress writes real icon rules", () => {
    expect(() =>
      assertIconsStylesheetEmpty(".vpi-social-github{--icon:url(x)}"),
    ).toThrow(/no longer empty/);
  });
});
