import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { styleToClassTransformer } from "../../theme/utils/codeTransformers";

type TestNode = { properties: { style?: unknown; class?: string | string[] } };

function makeNode(properties: TestNode["properties"]): TestNode {
  return { properties };
}

describe("styleToClassTransformer", () => {
  it("has the correct name", () => {
    expect(styleToClassTransformer.name).toBe("style-to-class");
  });

  it("turns a token span's style into classes and removes the style", () => {
    const node = makeNode({
      style: "--shiki-light:#4475B7;--shiki-dark:#99BDEA;",
    });

    styleToClassTransformer.span(node);

    expect(node.properties.class).toEqual([
      "shk-light-4475b7",
      "shk-dark-99bdea",
    ]);
    expect(node.properties).not.toHaveProperty("style");
  });

  it("handles the inherit values Shiki writes when themes disagree", () => {
    const node = makeNode({
      style: "--shiki-light:#4475B7;--shiki-dark-font-style:inherit",
    });

    styleToClassTransformer.span(node);

    expect(node.properties.class).toEqual([
      "shk-light-4475b7",
      "shk-dark-font-style-inherit",
    ]);
  });

  it("keeps the classes already on the node (string or array)", () => {
    const pre = makeNode({
      class: "shiki vp-code",
      style: "--shiki-light-bg:#FDFDFD",
    });
    const line = makeNode({
      class: ["line"],
      style: "--shiki-dark-font-style:italic",
    });

    styleToClassTransformer.pre(pre);
    styleToClassTransformer.line(line);

    expect(pre.properties.class).toEqual([
      "shiki",
      "vp-code",
      "shk-light-bg-fdfdfd",
    ]);
    expect(line.properties.class).toEqual([
      "line",
      "shk-dark-font-style-italic",
    ]);
  });

  it("leaves nodes without a style string alone", () => {
    const missing = makeNode({ class: "line" });
    const notAString = makeNode({ style: 42 });

    styleToClassTransformer.code(missing);
    styleToClassTransformer.code(notAString);

    expect(missing.properties).toEqual({ class: "line" });
    expect(notAString.properties).toEqual({ style: 42 });
  });

  it("fails loudly on a declaration it has no class for", () => {
    const node = makeNode({ style: "color:red;" });

    expect(() => styleToClassTransformer.span(node)).toThrow(
      /Unexpected inline style "color: red"/,
    );
  });
});

describe("code block backgrounds", () => {
  it("come from the .shiki rule in style.css", () => {
    const css = readFileSync(
      resolve(process.cwd(), ".vitepress/theme/style.css"),
      "utf8",
    );
    const rule = css.match(/\.shiki\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(rule).toContain("--shiki-light-bg: #fdfdfd");
    expect(rule).toContain("--shiki-dark-bg: #3c4c55");
  });
});
