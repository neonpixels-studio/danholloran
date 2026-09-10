export interface InstagramPost {
  created_at: string;
  caption: string;
  tags: string[];
  location: string;
  images: string[];
  url: string;
}

// HomeInstagram.vue is the sole consumer of instagram.data.ts and only ever
// reads these five frontmatter fields (never `tags`) off the six newest
// posts. transformInstagram.ts projects down to this shape so the other
// ~294 posts' full frontmatter — and the unused `tags` field on the six that
// remain — never leave the loader.
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
// carries): Instagram entries have no detail page of their own, and
// HomeInstagram links out via `frontmatter.url` (the Instagram permalink)
// instead, so that field was dead weight on every one of ~300 posts.
export interface InstagramContentItem {
  frontmatter: Partial<InstagramTileFrontmatter>;
}
