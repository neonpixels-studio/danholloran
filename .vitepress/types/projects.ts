import type { SkillInterface } from "./skills";

export interface ProjectInterface {
  company: string;
  image: string;
  url?: string;
  slug: string;
  skills: SkillInterface[];
  title: string;
  content: string;
}
