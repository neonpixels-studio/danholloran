// Shared by HomeBlog, PostsView, and PostView so a post's date renders
// identically (and safely) everywhere. Frontmatter dates come from hand-authored
// markdown, so a missing or malformed value is expected input, not a bug —
// callers must never see "Invalid Date".
const INVALID_DATE_FALLBACK = "Unknown date";

export type PostDateStyle = "short" | "long";

export function formatPostDate(
  date: string | null | undefined,
  style: PostDateStyle = "short",
): string {
  if (!date) {
    return INVALID_DATE_FALLBACK;
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return INVALID_DATE_FALLBACK;
  }
  return parsed.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: style,
    day: "numeric",
    year: "numeric",
  });
}

// Shared by the resume timeline components (HomeExperience, ResumeView) so a
// role/degree's date range renders identically everywhere. `end` is treated
// as "ongoing" for both `null` (explicitly open-ended) and `undefined`
// (field omitted) — callers should not have to normalize one into the other
// first.
export function formatPeriod(
  start: Date,
  end: Date | null | undefined,
): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  return end == null
    ? `${fmt(start)} – Present`
    : `${fmt(start)} – ${fmt(end)}`;
}
