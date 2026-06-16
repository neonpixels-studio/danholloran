import location from "../../data/location.json";

export const SITE_URL = "https://danholloran.me";

/** Current location, sourced from `.vitepress/data/location.json`. */
export const CURRENT_LOCATION = `${location.city}, ${location.state}`;

/** Site description, kept in sync with the current location. */
export const SITE_DESCRIPTION = `Full-stack developer and photographer based in ${CURRENT_LOCATION}.`;
