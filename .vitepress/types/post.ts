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
  src?: string;
  html?: string;
  frontmatter: PostMeta;
  excerpt?: string;
  url: string;
}
