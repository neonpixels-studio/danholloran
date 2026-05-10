export interface SkillInterface {
  image: string;
  name: string;
  url?: string;
  featured?: boolean;
}

export type SkillsMap = Record<string, SkillInterface>;
