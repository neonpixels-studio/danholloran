import { describe, it, expect } from "vitest";
import {
  buildTime,
  isScheduledAfter,
  publishCutoff,
  resolvePublishTime,
} from "../../theme/utils/publishSchedule";

function utc(iso: string): number {
  return new Date(iso).getTime();
}

describe("resolvePublishTime", () => {
  it("reads a datetime with an offset as an absolute instant", () => {
    expect(resolvePublishTime("2026-12-01T09:00:00+09:00")).toBe(
      utc("2026-12-01T00:00:00Z"),
    );
  });

  it("reads a date-only value as midnight Pacific standard time in winter", () => {
    expect(resolvePublishTime("2026-12-01")).toBe(utc("2026-12-01T08:00:00Z"));
  });

  it("reads a date-only value as midnight Pacific daylight time in summer", () => {
    expect(resolvePublishTime("2026-07-01")).toBe(utc("2026-07-01T07:00:00Z"));
  });

  it("uses the pre-switch offset on the days DST starts and ends", () => {
    expect(resolvePublishTime("2026-03-08")).toBe(utc("2026-03-08T08:00:00Z"));
    expect(resolvePublishTime("2026-11-01")).toBe(utc("2026-11-01T07:00:00Z"));
  });

  it("reads a UTC-midnight Date (an unquoted YAML date) as that Pacific day", () => {
    expect(resolvePublishTime(new Date("2026-12-01"))).toBe(
      utc("2026-12-01T08:00:00Z"),
    );
  });

  it("keeps a Date with a time of day as its absolute instant", () => {
    expect(resolvePublishTime(new Date("2026-12-01T15:30:00Z"))).toBe(
      utc("2026-12-01T15:30:00Z"),
    );
  });

  it.each([undefined, null, "", "not-a-date", "2026-02-30", 42, {}])(
    "returns null for a missing or unparseable date (%j)",
    (date) => {
      expect(resolvePublishTime(date)).toBeNull();
    },
  );
});

describe("isScheduledAfter", () => {
  const cutoff = new Date("2026-11-22T12:00:00Z");

  it("is false for a date at or before the cutoff", () => {
    expect(isScheduledAfter("2026-11-22T12:00:00Z", cutoff)).toBe(false);
    expect(isScheduledAfter("2026-01-01T00:00:00Z", cutoff)).toBe(false);
  });

  it("is true for a date after the cutoff", () => {
    expect(isScheduledAfter("2026-11-22T12:00:01Z", cutoff)).toBe(true);
  });

  it("is false for a missing date", () => {
    expect(isScheduledAfter(undefined, cutoff)).toBe(false);
  });
});

describe("publishCutoff", () => {
  it("hides scheduled posts only on Netlify production builds", () => {
    expect(publishCutoff({ CONTEXT: "production" })).toEqual(buildTime());
  });

  it.each([undefined, "deploy-preview", "branch-deploy", "dev"])(
    "shows scheduled posts when CONTEXT is %s",
    (context) => {
      expect(publishCutoff({ CONTEXT: context })).toBeNull();
    },
  );
});

describe("buildTime", () => {
  it("returns the same instant on every call", () => {
    expect(buildTime()).toBe(buildTime());
  });
});
