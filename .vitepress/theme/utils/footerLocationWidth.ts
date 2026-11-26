interface FooterLocation {
  city: string;
  state: string;
}

// style.css generates min-w-ch-1 through min-w-ch-40 (see its @source inline).
export const MAX_FOOTER_LOCATION_CH = 40;

// Reserves the width of the longest location so the footer does not shift as
// it rotates. Throws rather than silently dropping the width when a location
// is longer than the generated classes cover.
export function footerLocationWidthClass(
  locations: readonly FooterLocation[],
): string {
  const longest = Math.max(
    ...locations.map(
      (location) => `${location.city}, ${location.state}`.length,
    ),
  );
  if (longest > MAX_FOOTER_LOCATION_CH) {
    throw new Error(
      `Footer location is ${longest} characters; style.css only generates min-w-ch-1 through min-w-ch-${MAX_FOOTER_LOCATION_CH}`,
    );
  }
  return `min-w-ch-${longest}`;
}
