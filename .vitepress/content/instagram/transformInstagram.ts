import type { ContentData } from "vitepress";
import type { InstagramContentItem } from "@typedefs";

export const INSTAGRAM_GLOB = ".vitepress/content/instagram/*.md";

// HomeInstagram (the sole consumer, see HomeInstagram.vue) renders one full
// row of tiles at its widest breakpoint. Keep in sync with MAX_TILES there if
// that layout ever changes.
const HOME_TILE_COUNT = 6;

function byNewestFirst(a: ContentData, b: ContentData): number {
  return (
    new Date(b.frontmatter.created_at).getTime() -
    new Date(a.frontmatter.created_at).getTime()
  );
}

// HomeInstagram reads only these five frontmatter fields off the six newest
// posts (url/images/caption/location/created_at — never `tags`, and never the
// loader-generated page `url` VitePress attaches at the top level, since
// Instagram entries have no detail page of their own). Projecting down to
// just those fields here, on just the slice that ships, is what actually
// shrinks the payload; ~300 posts' worth of full frontmatter otherwise rides
// along for six tiles.
function toTile(post: ContentData): InstagramContentItem {
  const { created_at, caption, location, images, url } = post.frontmatter;
  return {
    frontmatter: { created_at, caption, location, images, url },
  };
}

export function transformInstagram(
  data: ContentData[],
): InstagramContentItem[] {
  return data.sort(byNewestFirst).slice(0, HOME_TILE_COUNT).map(toTile);
}
