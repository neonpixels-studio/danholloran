import { join } from "path";
import { gitLastModified } from "../theme/utils/gitLastModified";

// The travel map's "updated" date has to be resolved at build time (in Node,
// where git history is available) and baked into the client bundle — the
// browser has no access to git log. This mirrors sitemap.ts's fix for the
// same class of bug: an HTTP `Last-Modified` header (or a file's mtime) on a
// freshly built/deployed site reflects checkout time, not real content
// freshness, so the git commit date is the only signal that survives a
// rebuild of an unchanged image.
const MAP_IMAGES_DIR = join(process.cwd(), "public/images");

export interface MapUpdatedDates {
  light: string | null;
  dark: string | null;
}

declare const data: MapUpdatedDates;
export { data };

function isoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

export default {
  load(): MapUpdatedDates {
    return {
      light: isoOrNull(
        gitLastModified(join(MAP_IMAGES_DIR, "visited-locations-light.png")),
      ),
      dark: isoOrNull(
        gitLastModified(join(MAP_IMAGES_DIR, "visited-locations-dark.png")),
      ),
    };
  },
};
