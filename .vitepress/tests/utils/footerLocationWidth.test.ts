import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { FORCED_FOOTER_LOCATION } from "@data/footerLocation";
import { PAST_LOCATIONS } from "@data/resume";
import {
  MAX_FOOTER_LOCATION_CH,
  footerLocationWidthClass,
} from "@utils/footerLocationWidth";

describe("footerLocationWidthClass", () => {
  it("reserves the width of the longest location", () => {
    expect(
      footerLocationWidthClass([
        { city: "Reno", state: "NV" },
        { city: "St. Louis", state: "MO" },
      ]),
    ).toBe("min-w-ch-13");
  });

  it("fails loudly when a location is longer than the generated classes", () => {
    const tooLong = { city: "x".repeat(MAX_FOOTER_LOCATION_CH), state: "ZZ" };

    expect(() => footerLocationWidthClass([tooLong])).toThrow(
      /only generates min-w-ch-1 through min-w-ch-40/,
    );
  });

  it("fails loudly when there is no location", () => {
    expect(() => footerLocationWidthClass([])).toThrow(/at least one location/);
  });

  it("matches the range style.css generates classes for", () => {
    const css = readFileSync(
      resolve(process.cwd(), ".vitepress/theme/style.css"),
      "utf8",
    );

    expect(css).toContain(`min-w-ch-{1..${MAX_FOOTER_LOCATION_CH}}`);
  });

  it("covers every location the footer can show today", () => {
    const locations = FORCED_FOOTER_LOCATION
      ? [FORCED_FOOTER_LOCATION]
      : PAST_LOCATIONS;

    expect(() => footerLocationWidthClass(locations)).not.toThrow();
    expect(() => footerLocationWidthClass(PAST_LOCATIONS)).not.toThrow();
  });
});
