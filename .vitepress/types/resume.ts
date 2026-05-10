import type { Component } from "vue";
import type { SkillInterface } from "./skills";

export interface ResumeContactInterface {
  label: string;
  icon?: Component;
  link?: boolean;
}

export interface ResumeExperienceInterface {
  role: string;
  company: string;
  start: Date;
  end?: Date | null;
  url?: string;
  location: string;
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
  location: string;
  remote: boolean;
  skills: SkillInterface[];
}

export interface ResumeInterface {
  firstName: string;
  lastName: string;
  photo: string;
  headline: string;
  intro: string;
  summary: string;
  contacts: ResumeContactInterface[];
  skills(): SkillInterface[];
  experience: ResumeExperienceInterface[];
  education: ResumeEducationInterface[];
}
