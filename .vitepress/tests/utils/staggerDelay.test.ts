import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { FIRST_PAGE_SIZE } from "../../theme/utils/archive";
import {
  MAX_STAGGER_INDEX,
  STAGGER_STEP_MS,
  staggerDelayClass,
} from "../../theme/utils/staggerDelay";

const STYLE_CSS = readFileSync(
  resolve(process.cwd(), ".vitepress/theme/style.css"),
  "utf8",
);

describe("staggerDelayClass", () => {
  it("steps 60ms per card", () => {
    expect(staggerDelayClass(0)).toBe("td-0");
    expect(staggerDelayClass(1)).toBe("td-60");
    expect(staggerDelayClass(9)).toBe("td-540");
  });

  it("stops at the last card of the largest page", () => {
    expect(staggerDelayClass(FIRST_PAGE_SIZE - 1)).toBe(
      `td-${(FIRST_PAGE_SIZE - 1) * STAGGER_STEP_MS}`,
    );
    expect(staggerDelayClass(MAX_STAGGER_INDEX + 5)).toBe(
      staggerDelayClass(MAX_STAGGER_INDEX),
    );
    expect(staggerDelayClass(-1)).toBe("td-0");
  });

  it("has a delay rule in style.css for every card on a page", () => {
    for (let index = 0; index < FIRST_PAGE_SIZE; index++) {
      const milliseconds = index * STAGGER_STEP_MS;
      expect(STYLE_CSS).toMatch(
        new RegExp(
          `\\.td-${milliseconds} \\{\\s*transition-delay: ${milliseconds}ms;`,
        ),
      );
    }
  });
});
