import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const THEME_DIR = resolve(process.cwd(), ".vitepress/theme");
const STYLE_PATH = resolve(THEME_DIR, "style.css");
const FOOTER_PATH = resolve(THEME_DIR, "components/AppFooter.vue");
// Strict: the loops this change owns must win the cascade unconditionally.
const OWNED_ANIMATION_OFF = /animation:\s*none\s*!important/;
// Loose: any rule that silences the animation counts as coverage for the
// regression net (scoped components legitimately drop `!important`).
const ANIMATION_OFF = /animation:\s*none/;
const INFINITE_ANIMATION =
  /animation(?:-iteration-count)?\s*:[^;]*\binfinite\b/;

type StyleRule = { selectors: string[]; body: string };

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function readStyleSource(path: string): string {
  return stripComments(readFileSync(path, "utf8"));
}

function sliceBalancedBlock(css: string, openBrace: number): string {
  let depth = 0;
  let index = openBrace;
  while (index < css.length) {
    const character = css[index];
    index += 1;
    if (character === "{") {
      depth += 1;
      continue;
    }
    if (character !== "}") {
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return css.slice(openBrace, index);
    }
  }
  throw new Error("Unbalanced braces in prefers-reduced-motion block");
}

// Non-nested rules only: prelude + a brace-free declaration body. A rule that
// nests mis-parses (its declarations land in the prelude); loop detection below
// tolerates that by scanning prelude and body together.
function flatRules(css: string): StyleRule[] {
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  const rules: StyleRule[] = [];
  let match: RegExpExecArray | null;
  while ((match = rulePattern.exec(css)) !== null) {
    const selectors = match[1]
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean);
    rules.push({ selectors, body: match[2] });
  }
  return rules;
}

function reducedMotionRules(css: string): StyleRule[] {
  const header = /@media[^{}]*prefers-reduced-motion\s*:\s*reduce[^{}]*\{/g;
  const rules: StyleRule[] = [];
  let match: RegExpExecArray | null;
  while ((match = header.exec(css)) !== null) {
    const openBrace = match.index + match[0].length - 1;
    const block = sliceBalancedBlock(css, openBrace);
    const inner = block.slice(block.indexOf("{") + 1, block.lastIndexOf("}"));
    rules.push(...flatRules(inner));
    header.lastIndex = openBrace + block.length;
  }
  return rules;
}

function reducedMotionRulesOf(path: string): StyleRule[] {
  return reducedMotionRules(readStyleSource(path));
}

function declarationsFor(rules: StyleRule[], selector: string): string {
  const bodies = rules
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body);
  if (!bodies.length) {
    throw new Error(`No reduced-motion rule targets ${selector}`);
  }
  return bodies.join(";");
}

function neutralizedSelectors(css: string): string[] {
  return reducedMotionRules(css)
    .filter((rule) => ANIMATION_OFF.test(rule.body))
    .flatMap((rule) => rule.selectors);
}

// A `:hover`-style pseudo-class is neutralized by silencing the base selector
// with `!important`; a pseudo-element must be targeted directly, so keep it.
function baseSelector(selector: string): string {
  return selector.replace(/(?<!:):[\w-]+(?:\([^)]*\))?$/, "");
}

function infiniteLoopSelectors(css: string): string[] {
  return flatRules(css)
    .filter((rule) =>
      INFINITE_ANIMATION.test(rule.selectors.join(";") + ";" + rule.body),
    )
    .flatMap((rule) => rule.selectors);
}

function uncoveredInfiniteLoops(css: string): string[] {
  const covered = new Set(neutralizedSelectors(css));
  return infiniteLoopSelectors(css).filter(
    (selector) =>
      !covered.has(selector) && !covered.has(baseSelector(selector)),
  );
}

function themeStyleFiles(): string[] {
  return readdirSync(THEME_DIR, { recursive: true, encoding: "utf8" })
    .filter((name) => /\.(css|vue)$/.test(name))
    .map((name) => resolve(THEME_DIR, name));
}

// Continuous decorative CSS loops that reduced-motion must silence, per file.
// `.progress-bar` is scroll-timeline driven (no `infinite`) and removed rather
// than paused, so it rides along here but is asserted separately below.
const NEUTRALIZED_LOOPS: Array<{ path: string; selectors: string[] }> = [
  {
    path: STYLE_PATH,
    selectors: [".live-dot", ".mountain-float", ".glitch", ".progress-bar"],
  },
  { path: FOOTER_PATH, selectors: [".heartbeat"] },
];
const LOOP_CASES = NEUTRALIZED_LOOPS.flatMap(({ path, selectors }) =>
  selectors.map((selector) => ({ path, selector })),
);
const ENTRANCE_SELECTORS = [
  ".reveal",
  ".reveal-left",
  ".reveal-right",
  ".stagger > *",
  ".accent-line",
  ".fade-in",
];

describe("prefers-reduced-motion coverage", () => {
  LOOP_CASES.forEach(({ path, selector }) => {
    it(`stops ${selector} in its own reduced-motion rule`, () => {
      expect(declarationsFor(reducedMotionRulesOf(path), selector)).toMatch(
        OWNED_ANIMATION_OFF,
      );
    });
  });

  it("releases the live-dot compositor hint", () => {
    expect(
      declarationsFor(reducedMotionRulesOf(STYLE_PATH), ".live-dot"),
    ).toMatch(/will-change:\s*auto/);
  });

  it("removes the scroll progress bar instead of pinning it full-width", () => {
    expect(
      declarationsFor(reducedMotionRulesOf(STYLE_PATH), ".progress-bar"),
    ).toMatch(/display:\s*none/);
  });

  it("cancels the sitewide smooth scrolling", () => {
    expect(declarationsFor(reducedMotionRulesOf(STYLE_PATH), "html")).toMatch(
      /scroll-behavior:\s*auto/,
    );
  });

  ENTRANCE_SELECTORS.forEach((selector) => {
    it(`keeps the ${selector} entrance reset intact`, () => {
      const declarations = declarationsFor(
        reducedMotionRulesOf(STYLE_PATH),
        selector,
      );
      expect(declarations).toMatch(/opacity:\s*1/);
      expect(declarations).toMatch(/transform:\s*none/);
    });
  });

  // Regression net: no infinite loop anywhere in the theme may ship without a
  // reduced-motion rule that silences it.
  themeStyleFiles().forEach((path) => {
    it(`leaves no infinite loop uncovered in ${path.split("/").pop()}`, () => {
      expect(uncoveredInfiniteLoops(readStyleSource(path))).toEqual([]);
    });
  });

  it("flags an infinite loop that has no reduced-motion rule", () => {
    const css = ".spinner { animation: spin 1s linear infinite; }";
    expect(uncoveredInfiniteLoops(css)).toContain(".spinner");
  });

  it("flags an infinite loop declared in a rule that also nests", () => {
    const css = ".spin { animation: rot 1s infinite; &:hover { color: red; } }";
    expect(uncoveredInfiniteLoops(css).length).toBeGreaterThan(0);
  });

  it("accepts an infinite loop that reduced-motion neutralizes", () => {
    const css =
      ".spinner { animation: spin 1s infinite; }" +
      "@media (prefers-reduced-motion: reduce) { .spinner { animation: none !important; } }";
    expect(uncoveredInfiniteLoops(css)).toEqual([]);
  });
});
