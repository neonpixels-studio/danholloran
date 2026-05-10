export interface PostMeta {
  title: string;
  slug: string;
  image: string;
  draft: boolean;
  category: string;
  date: string;
  description: string;
  tags: string[];
  readTime: number;
}

export interface Post {
  frontmatter: PostMeta;
  url: string;
  body: string; // @todo How to get this???
}
