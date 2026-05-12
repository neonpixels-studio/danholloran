export interface SearchItem {
  type: "page" | "post" | "project";
  title: string;
  desc: string;
  href: string;
  kw: string;
}

export interface PostSearchItem {
  type: "post";
  title: string;
  desc: string;
  href: string;
  kw: string;
}
