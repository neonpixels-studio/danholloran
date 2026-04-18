import type { FunctionalComponent, HTMLAttributes, VNodeProps } from "vue";

export interface ResumePhotoInterface {
  url: string;
  alt?: string;
}

export interface ResumeContactInterface {
  unformatted: string;
  formatted: string;
  icon?: FunctionalComponent<HTMLAttributes & VNodeProps, {}, any, {}>;
}

export interface ResumeLocationInterface {
  unformatted: string;
  formatted: string;
  icon?: FunctionalComponent<HTMLAttributes & VNodeProps, {}, any, {}>;
}

export interface ResumeExperienceInterface {
  role: string;
  company: string;
  start: Date;
  end?: Date;
  url?: string;
  location: ResumeLocationInterface;
  remote: boolean;
  details: Array<string>;
  skills: Array<ResumeSkillInterface>;
}

export interface ResumeEducationInterface {
  degree: string;
  field: string;
  school: string;
  url: string;
  start: Date;
  end: Date;
  location: ResumeLocationInterface;
  skills: Array<ResumeSkillInterface>;
}

export interface ResumeSkillInterface {
  name: string;
  imageUrl: string;
  url?: string;
}

export interface ResumeInterface {
  firstName: string;
  lastName: string;
  photo: ResumePhotoInterface;
  headline: string;
  intro: string;
  contacts: Array<ResumeContactInterface>;
  skills: Function;
  experiences: Array<ResumeExperienceInterface>;
  educations: Array<ResumeEducationInterface>;
}
