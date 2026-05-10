export interface SearchItem {
  type: "page" | "post" | "project";
  title: string;
  desc: string;
  href: string;
  kw: string;
}
