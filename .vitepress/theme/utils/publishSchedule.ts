// Scheduled (future-dated) posts: a post whose frontmatter `date` is after the
// build time is merged early but only goes live on the first production build
// after that date. This module owns the date semantics; isPublished() in
// loadPublishedPosts.ts applies them. It has no relative imports so plain-node
// scripts (scripts/check-undeployed-commits.mjs) can import it directly.

const PUBLISH_TIME_ZONE = "America/Los_Angeles";
const PRODUCTION_CONTEXT = "production";
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const BUILD_TIME_KEY = Symbol.for("danholloran.publishSchedule.buildTime");

const PUBLISH_ZONE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: PUBLISH_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

type CalendarDay = { year: number; month: number; day: number };

function isUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

function isRealCalendarDay({ year, month, day }: CalendarDay): boolean {
  const canonical = new Date(Date.UTC(year, month - 1, day));
  return (
    canonical.getUTCFullYear() === year &&
    canonical.getUTCMonth() === month - 1 &&
    canonical.getUTCDate() === day
  );
}

// VitePress's content loader (gray-matter) turns an unquoted `date: 2026-12-01`
// into a Date at UTC midnight, while the site's own parser (yaml) keeps it as
// the string. Both must mean the same day, or a post could be listed before its
// page exists, so a UTC-midnight Date is read back as a date-only value.
function dateOnlyDay(date: unknown): CalendarDay | null {
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime()) || !isUtcMidnight(date)) {
      return null;
    }
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  }
  const match = typeof date === "string" ? DATE_ONLY_PATTERN.exec(date) : null;
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

// Milliseconds the publish time zone's wall clock is ahead of UTC at `instant`
// (negative for Pacific time).
function publishZoneOffset(instant: number): number {
  const parts = PUBLISH_ZONE_FORMATTER.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  const wallClock = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
  return wallClock - instant;
}

// UTC midnight of the day is the previous Pacific afternoon. DST switches at
// 02:00 local, so the offset there always equals the offset at local midnight.
function publishZoneMidnight({ year, month, day }: CalendarDay): number {
  const utcMidnight = Date.UTC(year, month - 1, day);
  return utcMidnight - publishZoneOffset(utcMidnight);
}

// The instant a post goes live, or null for a missing or unparseable date (the
// caller keeps its pre-scheduling behaviour for those: the post is published).
// A datetime with an offset is an absolute instant; a date-only value means
// 00:00 America/Los_Angeles on that day.
export function resolvePublishTime(date: unknown): number | null {
  if (!date) {
    return null;
  }
  const day = dateOnlyDay(date);
  if (day) {
    return isRealCalendarDay(day) ? publishZoneMidnight(day) : null;
  }
  if (typeof date !== "string" && !(date instanceof Date)) {
    return null;
  }
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? null : time;
}

export function isScheduledAfter(date: unknown, cutoff: Date): boolean {
  const publishTime = resolvePublishTime(date);
  return publishTime !== null && publishTime > cutoff.getTime();
}

// One build time per process. VitePress bundles config.ts, the route `paths`
// files, and each data loader separately, so a module-level constant would be
// re-evaluated per bundle; storing it on globalThis keeps every consumer
// comparing against the same instant.
export function buildTime(): Date {
  const store = globalThis as unknown as Record<symbol, Date | undefined>;
  store[BUILD_TIME_KEY] ??= new Date();
  return store[BUILD_TIME_KEY];
}

// Scheduled posts are hidden only from Netlify production builds. Deploy
// previews, branch deploys, CI, and `vitepress dev` render them so PR preview
// links work. Returns the instant posts must be at or before, or null when
// nothing is hidden.
export function publishCutoff(
  environment: Record<string, string | undefined> = process.env,
): Date | null {
  return environment.CONTEXT === PRODUCTION_CONTEXT ? buildTime() : null;
}
