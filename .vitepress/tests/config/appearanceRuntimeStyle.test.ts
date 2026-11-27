import { nextTick } from "vue";
import { useDark } from "@vueuse/core";
import { afterEach, describe, it, expect, vi } from "vitest";
import { STORAGE_KEY } from "../../theme/composables/useAppearance";
import { APPEARANCE_OPTIONS } from "../../theme/utils/appearanceOptions";

// vueuse removes its <style> element again within the same tick, so the DOM
// afterwards proves nothing; the element creation itself is what the hashed
// CSP reports (style-src-elem).
async function styleElementsCreatedByFlip(
  options: Record<string, unknown>,
): Promise<number> {
  const createElement = vi.spyOn(document, "createElement");
  const isDark = useDark({ storageKey: STORAGE_KEY, ...options });
  isDark.value = !isDark.value;
  await nextTick();
  return createElement.mock.calls.filter(([tag]) => tag === "style").length;
}

describe("theme flip", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.className = "";
    localStorage.clear();
  });

  it("creates no <style> element with the configured options", async () => {
    expect(await styleElementsCreatedByFlip(APPEARANCE_OPTIONS)).toBe(0);
  });

  it("creates one with vueuse's default, so the check can fail", async () => {
    expect(
      await styleElementsCreatedByFlip({ disableTransition: true }),
    ).toBeGreaterThan(0);
  });
});
