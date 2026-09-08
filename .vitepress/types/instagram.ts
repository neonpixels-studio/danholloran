export interface InstagramPost {
  created_at: string;
  caption: string;
  tags: string[];
  location: string;
  images: string[];
  url: string;
}

// Frontmatter is untyped, unvalidated markdown content — a post can omit any
// field (see HomeInstagram.vue's tileAlt/pickDeterministicImage, which already
// treat caption/location/images/url as optional). `Partial` keeps that honest
// instead of asserting fields the loader never actually guarantees.
export interface InstagramContentItem {
  frontmatter: Partial<InstagramPost>;
  url: string;
}
