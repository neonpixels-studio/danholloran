interface FooterLocation {
  city: string;
  state: string;
}

// Pins the footer's "Built with ... in <location>" to one place. Set to null
// to rotate through past-locations.json instead.
export const FORCED_FOOTER_LOCATION: FooterLocation | null = {
  city: "St. Louis",
  state: "MO",
};
