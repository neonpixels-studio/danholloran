import type { ContentData } from "vitepress";
import type { InstagramContentItem, InstagramTileFrontmatter } from "@typedefs";

export const INSTAGRAM_GLOB = ".vitepress/content/instagram/*.md";

// HomeInstagram (the sole consumer, see HomeInstagram.vue) renders one full
// row of tiles — the template's `grid-cols-6` class. Keep both in sync if
// that layout ever changes.
const HOME_TILE_COUNT = 6;

// A missing or malformed created_at makes `new Date(...).getTime()` return
// NaN, and Array.prototype.sort treats a NaN comparator result as "equal" —
// leaving that post in its arbitrary glob position instead of sorted last,
// which could push it into the six tiles ahead of an actually-newer post (or
// bump a real one out via the slice below). Fall back to 0 (oldest) so an
// undated post always sorts last rather than silently corrupting the order.
function createdAtTime(post: ContentData): number {
  const time = new Date(post.frontmatter.created_at).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function byNewestFirst(first: ContentData, second: ContentData): number {
  return createdAtTime(second) - createdAtTime(first);
}

// HomeInstagram reads only these five frontmatter fields off the six newest
// posts (url/images/caption/location/created_at — never `tags`, and never the
// loader-generated page `url` VitePress attaches at the top level, since
// Instagram entries have no detail page of their own). Projecting down to
// just those fields here, on just the slice that ships, is what actually
// shrinks the payload; otherwise every post's full frontmatter rides along
// for the handful of tiles Home renders.
function toTile(post: ContentData): InstagramContentItem {
  const { created_at, caption, location, images, url } = post.frontmatter;
  // Annotated against the full (non-Partial) InstagramTileFrontmatter, not
  // just returned as InstagramContentItem's Partial<...> field, so dropping
  // one of these five keys is a compile error instead of a silent gap that
  // only Partial's optionality would let through.
  const frontmatter: InstagramTileFrontmatter = {
    created_at,
    caption,
    location,
    images,
    url,
  };
  return { frontmatter };
}

export function transformInstagram(
  data: ContentData[],
): InstagramContentItem[] {
  return data.sort(byNewestFirst).slice(0, HOME_TILE_COUNT).map(toTile);
}
