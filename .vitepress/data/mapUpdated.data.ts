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

// A null result (untracked file, no git history, git unavailable) silently
// degrades the card to "updated automatically" with no build-time signal
// that anything went wrong — warn so a broken path or a missing image is
// visible in build logs instead of only in the rendered page months later.
function resolveDate(filePath: string): string | null {
  const date = gitLastModified(filePath);
  if (!date) {
    console.warn(
      `mapUpdated.data.ts: no git history for ${filePath}; HomeTravelMap will show "updated automatically"`,
    );
    return null;
  }
  return date.toISOString();
}

export default {
  load(): MapUpdatedDates {
    return {
      light: resolveDate(join(MAP_IMAGES_DIR, "visited-locations-light.png")),
      dark: resolveDate(join(MAP_IMAGES_DIR, "visited-locations-dark.png")),
    };
  },
};
