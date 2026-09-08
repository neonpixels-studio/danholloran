export function formatPostDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
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
