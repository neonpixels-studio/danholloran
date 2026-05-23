import { describe, it, expect } from "vitest";
import { injectThemeBgTransformer } from "../../theme/utils/codeTransformers";

const CSS_VARS = "--shiki-light-bg:#FDFDFD;--shiki-dark-bg:#3C4C55;";

function makeNode(style?: string | unknown): {
  properties: { style?: string | unknown };
} {
  return { properties: { style } };
}

describe("injectThemeBgTransformer", () => {
  it("has the correct name", () => {
    expect(injectThemeBgTransformer.name).toBe("inject-theme-bg");
  });

  it("sets theme CSS vars when style is undefined", () => {
    const node = makeNode(undefined);
    injectThemeBgTransformer.pre(node);
    expect(node.properties.style).toBe(CSS_VARS);
  });

  it("sets theme CSS vars when style is an empty string", () => {
    const node = makeNode("");
    injectThemeBgTransformer.pre(node);
    expect(node.properties.style).toBe(CSS_VARS);
  });

  it("prepends CSS vars and preserves existing style string", () => {
    const existing = "color:red;";
    const node = makeNode(existing);
    injectThemeBgTransformer.pre(node);
    expect(node.properties.style).toBe(`${CSS_VARS}${existing}`);
  });

  it("ignores non-string existing styles and treats them as empty", () => {
    const node = makeNode(42);
    injectThemeBgTransformer.pre(node);
    expect(node.properties.style).toBe(CSS_VARS);
  });
});
