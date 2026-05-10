import type { Component } from "vue";
import type { SkillInterface } from "./skills";

export interface ResumePhotoInterface {
  url: string;
  alt?: string;
}

export interface ResumeContactInterface {
  unformatted: string;
  formatted: string;
  icon?: Component;
}

export interface ResumeLocationInterface {
  unformatted: string;
  formatted: string;
  icon?: Component;
}

export interface ResumeExperienceInterface {
  role: string;
  company: string;
  start: Date;
  end?: Date | null;
  url?: string;
  location: ResumeLocationInterface;
  remote: boolean;
  details: string[];
  skills: SkillInterface[];
}

export interface ResumeEducationInterface {
  degree: string;
  field: string;
  school: string;
  url: string;
  start: Date;
  end: Date;
  location: ResumeLocationInterface;
  skills: SkillInterface[];
}

export interface ResumeInterface {
  firstName: string;
  lastName: string;
  photo: ResumePhotoInterface;
  headline: string;
  intro: string;
  contacts: ResumeContactInterface[];
  skills(): SkillInterface[];
  experiences: ResumeExperienceInterface[];
  educations: ResumeEducationInterface[];
}
