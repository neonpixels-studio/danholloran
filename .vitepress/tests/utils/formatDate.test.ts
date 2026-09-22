import { describe, it, expect } from "vitest";
import { formatPostDate, formatPeriod } from "../../theme/utils/formatDate";

describe("formatPostDate", () => {
  it("formats a date string to short month, day, year", () => {
    expect(formatPostDate("2024-01-15")).toBe("Jan 15, 2024");
  });

  it("formats a date at the start of the year", () => {
    expect(formatPostDate("2023-01-01")).toBe("Jan 1, 2023");
  });

  it("formats a date at the end of the year", () => {
    expect(formatPostDate("2023-12-31")).toBe("Dec 31, 2023");
  });

  it("formats an ISO datetime string", () => {
    expect(formatPostDate("2025-06-15T12:00:00.000Z")).toBe("Jun 15, 2025");
  });

  it("formats an ISO datetime with a timezone offset in UTC calendar terms", () => {
    // Real frontmatter dates carry an explicit offset (e.g. "-05:00"), and
    // the source-offset day and the UTC day genuinely differ here (10pm
    // "-05:00" is already the next day in UTC). The rendered day must
    // follow UTC so server and browser output always agree.
    expect(formatPostDate("2026-07-25T22:00:00.000-05:00")).toBe(
      "Jul 26, 2026",
    );
  });

  it("keeps the UTC calendar day near a UTC midnight boundary", () => {
    expect(formatPostDate("2024-01-15T23:30:00.000Z", "long")).toBe(
      "January 15, 2024",
    );
  });

  it("renders in UTC regardless of the local machine timezone", () => {
    // toLocaleDateString falls back to the system timezone when no
    // `timeZone` option is given, so this only proves the formatter passes
    // `timeZone: "UTC"` if the assertion is checked under a non-UTC TZ.
    const originalTimeZone = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati"; // UTC+14
    try {
      expect(formatPostDate("2024-01-15T23:30:00.000Z", "long")).toBe(
        "January 15, 2024",
      );
    } finally {
      process.env.TZ = originalTimeZone;
    }
  });

  it("formats with the long month style", () => {
    expect(formatPostDate("2024-01-15", "long")).toBe("January 15, 2024");
  });

  it("falls back to a safe string for an unparseable date", () => {
    expect(formatPostDate("not-a-date")).toBe("Unknown date");
  });

  it("falls back to a safe string for a non-ISO date format", () => {
    // "2024/01/15" and similar formats parse as *local* midnight in
    // JavaScript, which would silently shift the rendered day depending on
    // the machine's timezone — treat it as malformed rather than guess.
    expect(formatPostDate("2024/01/15")).toBe("Unknown date");
  });

  it("falls back to a safe string for a datetime with no offset", () => {
    // No `Z`/offset means JavaScript parses this as local time, which has
    // the same cross-machine ambiguity as a non-ISO format.
    expect(formatPostDate("2024-01-15T23:30:00")).toBe("Unknown date");
  });

  it("falls back to a safe string for an impossible calendar date", () => {
    // V8 rolls "2024-02-30" forward to Mar 1 instead of producing NaN; a
    // typo'd day must not silently render a different, wrong date.
    expect(formatPostDate("2024-02-30")).toBe("Unknown date");
  });

  it("falls back to a safe string for a missing date", () => {
    expect(formatPostDate(undefined)).toBe("Unknown date");
  });

  it("falls back to a safe string for an empty date", () => {
    expect(formatPostDate("")).toBe("Unknown date");
  });

  it("falls back to a safe string for a null date", () => {
    expect(formatPostDate(null)).toBe("Unknown date");
  });
});

describe("formatPeriod", () => {
  it("formats a closed range between two dates", () => {
    expect(formatPeriod(new Date("2020-01-01"), new Date("2022-06-01"))).toBe(
      "Jan 2020 – Jun 2022",
    );
  });

  // An explicit `null` (e.g. a current job) and an omitted `undefined` (e.g.
  // an education entry with no `end` field) must render identically —
  // callers should not have to normalize one into the other first.
  it("renders 'Present' when end is null", () => {
    expect(formatPeriod(new Date("2020-01-01"), null)).toBe(
      "Jan 2020 – Present",
    );
  });

  it("renders 'Present' when end is undefined", () => {
    expect(formatPeriod(new Date("2020-01-01"), undefined)).toBe(
      "Jan 2020 – Present",
    );
  });
});
