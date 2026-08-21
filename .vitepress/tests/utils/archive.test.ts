import { describe, it, expect } from "vitest";
import {
  FIRST_PAGE_SIZE,
  REST_PAGE_SIZE,
  archiveHref,
  extraPageNumbers,
  hasFilterRoute,
  pageSlice,
  pickRepresentativeLabel,
  toFilterSlug,
  toPageNumber,
  totalPagesForCount,
} from "@utils/archive";

describe("toFilterSlug", () => {
  it("lowercases and dashes non-alphanumeric runs", () => {
    expect(toFilterSlug("React.js")).toBe("react-js");
    expect(toFilterSlug("Progressive Web Apps")).toBe("progressive-web-apps");
  });

  it("trims leading and trailing separators", () => {
    expect(toFilterSlug("  #hashtag!  ")).toBe("hashtag");
  });

  it("collapses labels that differ only by punctuation to one slug", () => {
    expect(toFilterSlug("tailwind.css")).toBe(toFilterSlug("tailwind-css"));
  });

  it("folds accents to ASCII instead of splitting on the combining mark", () => {
    expect(toFilterSlug("Café")).toBe("cafe");
    expect(toFilterSlug("Québec")).toBe("quebec");
  });

  it("returns an empty slug for a label with no alphanumerics", () => {
    expect(toFilterSlug("→")).toBe("");
    expect(toFilterSlug("!!!")).toBe("");
  });
});

describe("hasFilterRoute", () => {
  it("is true only when the label slugs to something routable", () => {
    expect(hasFilterRoute("javascript")).toBe(true);
    expect(hasFilterRoute("→")).toBe(false);
    expect(hasFilterRoute("")).toBe(false);
  });

  it("rejects non-strings and the reserved 'all' sentinel", () => {
    expect(hasFilterRoute(2024 as unknown)).toBe(false);
    expect(hasFilterRoute(undefined)).toBe(false);
    expect(hasFilterRoute("all")).toBe(false);
    expect(hasFilterRoute("All")).toBe(false);
  });
});

describe("pickRepresentativeLabel", () => {
  it("takes the candidate when there is no existing label", () => {
    expect(pickRepresentativeLabel(undefined, "Travel")).toBe("Travel");
  });

  it("keeps the lexicographically smallest label", () => {
    expect(pickRepresentativeLabel("tailwind.css", "tailwind-css")).toBe(
      "tailwind-css",
    );
    expect(pickRepresentativeLabel("tailwind-css", "tailwind.css")).toBe(
      "tailwind-css",
    );
  });
});

describe("toPageNumber", () => {
  it("passes through valid 1-based integers", () => {
    expect(toPageNumber("2")).toBe(2);
    expect(toPageNumber(5)).toBe(5);
  });

  it("falls back to page 1 for missing or malformed values", () => {
    expect(toPageNumber(undefined)).toBe(1);
    expect(toPageNumber(NaN)).toBe(1);
    expect(toPageNumber("0")).toBe(1);
    expect(toPageNumber("-3")).toBe(1);
    expect(toPageNumber("abc")).toBe(1);
  });
});

describe("totalPagesForCount", () => {
  it("returns one page when posts fit the first page", () => {
    expect(totalPagesForCount(0)).toBe(1);
    expect(totalPagesForCount(FIRST_PAGE_SIZE)).toBe(1);
  });

  it("adds rest-sized pages beyond the first page", () => {
    expect(totalPagesForCount(FIRST_PAGE_SIZE + 1)).toBe(2);
    expect(totalPagesForCount(FIRST_PAGE_SIZE + REST_PAGE_SIZE)).toBe(2);
    expect(totalPagesForCount(FIRST_PAGE_SIZE + REST_PAGE_SIZE + 1)).toBe(3);
  });
});

describe("pageSlice", () => {
  const items = Array.from({ length: 25 }, (_unused, index) => index);

  it("returns the first-page window for page 1", () => {
    expect(pageSlice(items, 1)).toEqual(items.slice(0, FIRST_PAGE_SIZE));
  });

  it("returns rest-page windows for later pages", () => {
    expect(pageSlice(items, 2)).toEqual(items.slice(10, 19));
    expect(pageSlice(items, 3)).toEqual(items.slice(19, 28));
  });
});

describe("extraPageNumbers", () => {
  it("is empty when everything fits on page 1", () => {
    expect(extraPageNumbers(FIRST_PAGE_SIZE)).toEqual([]);
  });

  it("lists pages 2..N", () => {
    expect(extraPageNumbers(FIRST_PAGE_SIZE + REST_PAGE_SIZE + 1)).toEqual([
      2, 3,
    ]);
  });
});

describe("archiveHref", () => {
  it("points page 1 of the unfiltered archive at the base", () => {
    expect(archiveHref(1)).toBe("/posts");
  });

  it("adds a page segment beyond page 1", () => {
    expect(archiveHref(2)).toBe("/posts/page/2");
  });

  it("builds topic routes with and without a page segment", () => {
    expect(archiveHref(1, { topicSlug: "development" })).toBe(
      "/posts/topic/development",
    );
    expect(archiveHref(3, { topicSlug: "development" })).toBe(
      "/posts/topic/development/page/3",
    );
  });

  it("builds tag routes and prefers a topic when both are given", () => {
    expect(archiveHref(2, { tagSlug: "javascript" })).toBe(
      "/posts/tag/javascript/page/2",
    );
    expect(archiveHref(1, { topicSlug: "travel", tagSlug: "css" })).toBe(
      "/posts/topic/travel",
    );
  });
});
