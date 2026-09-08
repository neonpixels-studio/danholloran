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
