import { describe, it, expect } from "vitest";
import {
  buildColorClassesCss,
  colorClass,
  rainbowGradient,
} from "../../theme/utils/themeColorClasses";

describe("colorClass", () => {
  it("names a class after the kind and the lowercase hex", () => {
    expect(colorClass("bg", "#83AFE5")).toBe("hex-bg-83afe5");
    expect(colorClass("text", "#a7a39c")).toBe("hex-text-a7a39c");
  });

  it.each(["red", "#fff", "#12345", "#12345g", ""])(
    "rejects %j, which is not a 6-digit hex color",
    (value) => {
      expect(() => colorClass("bg", value)).toThrow(/6-digit hex/);
    },
  );
});

describe("rainbowGradient", () => {
  it("loops back to the first stop so the pan is seamless", () => {
    expect(rainbowGradient(["#FF2D9B", "#FACC15"])).toBe(
      "linear-gradient(90deg, #ff2d9b, #facc15, #ff2d9b)",
    );
  });
});

describe("buildColorClassesCss", () => {
  const css = buildColorClassesCss({
    hexes: ["#FF2D9B", "#ff2d9b", "#0A0A0B"],
    rainbowStops: ["#FF2D9B", "#FACC15"],
    copyFailedColor: "#FF2D9B",
  });

  it("generates every kind of rule once per distinct color", () => {
    expect(css).toContain(".hex-bg-ff2d9b { background: #ff2d9b; }");
    expect(css).toContain(".hex-text-ff2d9b { color: #ff2d9b; }");
    expect(css).toContain(".hex-border-0a0a0b { border-color: #0a0a0b; }");
    expect(css).toContain(
      ".hex-glow-ff2d9b { box-shadow: 0 0 22px #ff2d9b66; }",
    );
    expect(css.match(/\.hex-bg-ff2d9b /g)).toHaveLength(1);
  });

  it("generates the rainbow gradient and copy-failed color from the data", () => {
    expect(css).toContain(
      ".hex-rainbow-gradient { background-image: linear-gradient(90deg, #ff2d9b, #facc15, #ff2d9b); }",
    );
    expect(css).toContain(".hex-copy-failed { --n-copy-failed: #ff2d9b; }");
  });
});
