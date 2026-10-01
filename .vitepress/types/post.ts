export interface PostMeta {
  title: string;
  slug: string;
  image: string;
  draft: boolean;
  topic: string;
  date: string;
  description: string;
  tags: string[];
  readTime: number;
}

export interface Post {
  html?: string;
  frontmatter: PostMeta;
  url: string;
  // Decided once at load time by resolvePublishedDate; render surfaces pass it
  // to formatPostDate instead of re-deriving validity from the raw date.
  dateIsValid: boolean;
}
