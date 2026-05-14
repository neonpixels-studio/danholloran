import { describe, it, expect } from "vitest";
import { formatPostDate } from "../../theme/utils/formatDate";

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
