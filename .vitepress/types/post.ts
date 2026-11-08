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
  // Snake_case to match the existing legacy WordPress-era frontmatter key.
  // Optional notice shown as a banner above the post body (e.g. a project is
  // no longer maintained).
  alert_message?: string;
}

export interface Post {
  frontmatter: PostMeta;
  url: string;
  // Decided once at load time by resolvePublishedDate; render surfaces read it
  // via formatPostDateFor instead of re-deriving validity from the raw date.
  dateIsValid: boolean;
}
