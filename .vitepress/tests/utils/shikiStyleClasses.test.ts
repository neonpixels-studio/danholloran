import { describe, it, expect } from "vitest";
import {
  buildShikiClassCss,
  declarationsFromStyle,
  shikiDeclarationClass,
} from "../../theme/utils/shikiStyleClasses";

describe("declarationsFromStyle", () => {
  it("splits Shiki's style string into property/value pairs", () => {
    expect(
      declarationsFromStyle("--shiki-light:#aaa;--shiki-dark:#BBB;"),
    ).toEqual([
      ["--shiki-light", "#aaa"],
      ["--shiki-dark", "#BBB"],
    ]);
  });

  it("returns nothing for an empty style", () => {
    expect(declarationsFromStyle("")).toEqual([]);
  });
});

describe("shikiDeclarationClass", () => {
  it.each([
    ["--shiki-light", "#4475B7", "shk-light-4475b7"],
    ["--shiki-dark", "#E5E5E5BB", "shk-dark-e5e5e5bb"],
    ["--shiki-dark-bg", "#3C4C55", "shk-dark-bg-3c4c55"],
    ["--shiki-light-font-style", "italic", "shk-light-font-style-italic"],
    [
      "--shiki-dark-text-decoration",
      "underline line-through",
      "shk-dark-text-decoration-underline-line-through",
    ],
  ])("names %s: %s as %s", (property, value, expected) => {
    expect(shikiDeclarationClass(property, value)).toBe(expected);
  });

  it("rejects a property that is not a Shiki variable", () => {
    expect(() => shikiDeclarationClass("color", "red")).toThrow(
      /Unexpected inline style/,
    );
  });
});

describe("buildShikiClassCss", () => {
  const themes = {
    light: {
      settings: [
        { settings: { foreground: "#4475B7" } },
        { settings: { fontStyle: "italic bold" } },
        { settings: { fontStyle: "underline" } },
      ],
    },
    dark: { settings: [{ settings: { foreground: "#99BDEA" } }, {}] },
  };

  it("defines a rule for every color and font style the themes use", () => {
    const css = buildShikiClassCss(themes);

    expect(css).toContain(".shk-light-4475b7 { --shiki-light: #4475B7; }");
    expect(css).toContain(".shk-dark-99bdea { --shiki-dark: #99BDEA; }");
    expect(css).toContain(
      ".shk-light-font-style-italic { --shiki-light-font-style: italic; }",
    );
    expect(css).toContain(
      ".shk-light-font-weight-bold { --shiki-light-font-weight: bold; }",
    );
    expect(css).toContain(
      ".shk-light-text-decoration-underline { --shiki-light-text-decoration: underline; }",
    );
  });

  it("defines each class once", () => {
    const css = buildShikiClassCss({
      light: { settings: [{ settings: { foreground: "#AAAAAA" } }] },
      dark: { settings: [{ settings: { foreground: "#AAAAAA" } }] },
    });

    expect(css.match(/\.shk-light-aaaaaa /g)).toHaveLength(1);
  });
});
