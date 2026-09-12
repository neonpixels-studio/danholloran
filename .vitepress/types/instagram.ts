export interface InstagramPost {
  created_at: string;
  caption: string;
  tags: string[];
  location: string;
  images: string[];
  url: string;
}

// The subset of InstagramPost the loader actually ships — see
// transformInstagram.ts for which fields and why.
export type InstagramTileFrontmatter = Pick<
  InstagramPost,
  "created_at" | "caption" | "location" | "images" | "url"
>;

// Frontmatter is untyped, unvalidated markdown content — a post can omit any
// field (see HomeInstagram.vue's tileAlt/pickDeterministicImage, which already
// treat caption/location/images/url as optional). `Partial` keeps that honest
// instead of asserting fields the loader never actually guarantees.
//
// No top-level `url` (the page route VitePress's ContentData normally
// carries) — see transformInstagram.ts for why that field is dropped too.
export interface InstagramContentItem {
  frontmatter: Partial<InstagramTileFrontmatter>;
}
