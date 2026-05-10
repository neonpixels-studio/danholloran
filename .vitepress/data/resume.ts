import {
  PhoneIcon,
  EnvelopeOpenIcon,
  UserIcon,
  MapPinIcon,
} from "@heroicons/vue/16/solid";
import type { ResumeInterface } from "@typedefs";
import { SKILLS } from "./skills";
import GithubIcon from "@components/GithubIcon.vue";
import InstagramIcon from "@components/InstagramIcon.vue";
import LinkedinIcon from "@components/LinkedinIcon.vue";

export const LOCATION = {
  unformatted: "",
  formatted: "Reno, NV 89504",
  icon: MapPinIcon,
};

const getExperienceLength = () => {
  return new Date().getFullYear() - 2012;
};

export default {
  firstName: "Dan",
  lastName: "Holloran",
  photo: {
    url: "/images/headshot.png",
  },
  headline: "Senior Frontend & Fullstack Developer | Engineering Leader",
  intro: `Dynamic Senior Frontend & Fullstack Developer with ${getExperienceLength()}+ years of experience building responsive, performant web applications and leading engineering teams. Proven track record of reducing load times, improving user engagement, and directing cross-functional teams of 10+ developers. Equally comfortable owning complex frontend architecture with Vue.js and React, diving into Fullstack work with Laravel and PHP, or stepping into an engineering leadership role. Looking to bring deep technical expertise and a collaborative leadership style to an innovative startup or mid-sized product team — remotely.`,
  contacts: [
    {
      unformatted: "tel:3148828326",
      formatted: "(314) 882-8326",
      icon: PhoneIcon,
    },
    {
      unformatted: "mailto:hello@danholloran.me",
      formatted: "hello@danholloran.me",
      icon: EnvelopeOpenIcon,
    },
    {
      unformatted: "https://danholloran.me",
      formatted: "danholloran.me",
      icon: UserIcon,
    },
    {
      unformatted: "https://danholloran.me/social/github",
      formatted: "github.com/grimicorn",
      icon: GithubIcon,
    },
    {
      unformatted: "https://danholloran.me/social/instagram",
      formatted: "@grimicornsparkles",
      icon: InstagramIcon,
    },
    {
      unformatted: "https://danholloran.me/social/linkedin",
      formatted: "linkedin.com/in/dan-holloran",
      icon: LinkedinIcon,
    },
    LOCATION,
  ],
  skills() {
    // @todo How to type the sort()?
    return [
      ...new Set(
        [...this.experiences, ...this.educations]
          .map(({ skills }) => skills)
          .flat(),
      ),
    ].sort((a, b) => a.name.localeCompare(b.name));
  },
  experiences: [
    {
      role: "Senior Fullstack Developer",
      company: "Ample",
      start: new Date("09/29/2019"),
      end: null,
      url: "https://ample.co",
      location: {
        formatted: "Cincinnati, OH",
        unformatted: "Cincinnati, OH",
      },
      remote: true,
      details: [
        "Architected and maintain crossroads.net, driving ongoing performance improvements and reducing technical debt across a modern JavaScript stack",
        "Collaborate cross-functionally with designers, translating product requirements into polished frontend experiences",
        "Lead pair programming sessions and code reviews to elevate team code quality and accelerate junior developer growth",
        "Evaluate and integrate emerging AI tools and workflows to accelerate feature development cycles and improve overall team efficiency",
      ],
      skills: [
        SKILLS.REACT,
        SKILLS.NEXT_JS,
        SKILLS.GATSBY,
        SKILLS.NODE_JS,
        SKILLS.JAVASCRIPT,
        SKILLS.GRAPHQL,
        SKILLS.JAMSTACK,
        SKILLS.MENTORSHIP,
        SKILLS.ARCHITECTURE,
        SKILLS.RUBY,
        SKILLS.HTML,
        SKILLS.CSS,
        SKILLS.REST_API,
        SKILLS.JEST,
        SKILLS.CYPRESS,
      ],
    },
    {
      role: "Career Sabbatical",
      company: "Life",
      start: new Date("03/15/2025"),
      end: new Date("09/28/2025"),
      url: "/instagram/",
      location: {
        formatted: "United States",
        unformatted: "United States",
      },
      remote: true,
      details: [
        "My position was eliminated and decided to take it as a career sabbatical to travel, recharge, and return with a fresh perspective and renewed focus.",
      ],
      skills: [SKILLS.PHOTOGRAPHY],
    },
    {
      role: "Senior Frontend Developer",
      company: "Tradier",
      start: new Date("02/29/2021"),
      end: new Date("03/15/2025"),
      url: "https://tradier.com",
      location: {
        formatted: "Charlotte, NC",
        unformatted: "Charlotte, NC",
      },
      remote: true,
      details: [
        "Redesigned frontend platform architecture, achieving a 25% improvement in load times and a measurable lift in user engagement metrics",
        "Built dynamic, high-performance single-page applications using Vue, Nuxt, and Tailwind CSS, reducing bounce rates by 10%",
        "Mentored 2 junior developers through structured code reviews and pair programming, fostering a culture of continuous learning and shared ownership",
        "Partnered closely with UX/UI designers to translate wireframes into polished, responsive web applications, boosting overall user experience",
      ],
      skills: [
        SKILLS.VUE_JS,
        SKILLS.TAILWIND_CSS,
        SKILLS.JAMSTACK,
        SKILLS.VITE,
        SKILLS.VITEST,
        SKILLS.JAVASCRIPT,
        SKILLS.NODE_JS,
        SKILLS.GRAPHQL,
        SKILLS.REST_API,
        SKILLS.LEADERSHIP,
        SKILLS.MENTORSHIP,
        SKILLS.ARCHITECTURE,
        SKILLS.RUBY,
        SKILLS.HTML,
        SKILLS.CSS,
        SKILLS.NUXT,
        SKILLS.JEST,
        SKILLS.CYPRESS,
      ],
    },
    {
      role: "Senior Fullstack Developer / Lead Developer",
      company: "Ample",
      start: new Date("10/31/2019"),
      end: new Date("02/29/2021"),
      url: "https://ample.co",
      location: {
        formatted: "Cincinnati, OH",
        unformatted: "Cincinnati, OH",
      },
      remote: true,
      details: [
        "Assisted a key client in transitioning to online services during COVID-19, resulting in a 35% increase in web property usage virtually overnight",
        "Directed engineering operations for a team of 10 developers, owning technical decision-making, roadmap prioritization, and cross-team collaboration",
        "Implemented agile methodologies that streamlined development workflows, resulting in a 20% increase in project delivery speed",
        "Oversaw architecture and implementation of complex web applications using React and Gatsby, improving both user experience and system performance",
        "Championed career development initiatives across the team, creating targeted growth plans that helped engineers build new technical skills and advance their careers",
      ],
      skills: [
        SKILLS.REACT,
        SKILLS.NEXT_JS,
        SKILLS.GATSBY,
        SKILLS.NODE_JS,
        SKILLS.JAVASCRIPT,
        SKILLS.GRAPHQL,
        SKILLS.JAMSTACK,
        SKILLS.LEADERSHIP,
        SKILLS.MENTORSHIP,
        SKILLS.ARCHITECTURE,
        SKILLS.RUBY,
        SKILLS.HTML,
        SKILLS.CSS,
        SKILLS.REST_API,
        SKILLS.JEST,
        SKILLS.CYPRESS,
      ],
    },
    {
      role: "Full Stack Developer / Lead Developer",
      company: "Matchbox Design Group",
      start: new Date("11/01/2012"),
      end: new Date("10/31/2019"),
      url: "https://matchboxdesigngroup.com",
      location: {
        formatted: "St. Louis, MO",
        unformatted: "St. Louis, MO",
      },
      remote: false,
      details: [
        "Optimized website performance across 50+ client projects, achieving 90+ scores on Google PageSpeed Insights and reducing average bounce rates by 25%",
        "Integrated AS400 inventory systems to automate real-time product updates, eliminating manual processes and reliably meeting complex client data requirements",
        "Led cross-functional teams in the planning and execution of strategic web initiatives, delivering a 15% increase in project efficiency",
        "Built intuitive, user-friendly websites using WordPress, Laravel, Vue, and PHP, successfully delivering 50+ projects on time and within scope",
        "Established streamlined client communication workflows that reduced friction, improved collaboration, and cut launch times by 15%",
      ],
      skills: [
        SKILLS.VUE_JS,
        SKILLS.TAILWIND_CSS,
        SKILLS.LARAVEL,
        SKILLS.WORDPRESS,
        SKILLS.ARCHITECTURE,
        SKILLS.LEADERSHIP,
        SKILLS.MENTORSHIP,
        SKILLS.JAVASCRIPT,
        SKILLS.NODE_JS,
        SKILLS.PHP,
        SKILLS.MYSQL,
        SKILLS.POSTGRESQL,
        SKILLS.CSS,
        SKILLS.HTML,
        SKILLS.REDIS,
        SKILLS.REST_API,
        SKILLS.SASS,
        SKILLS.STATAMIC,
        SKILLS.CYPRESS,
        SKILLS.JEST,
      ],
    },
  ],
  educations: [
    {
      degree: "Bachelor of Science",
      field: "Web Design and Development",
      school: "Full Sail University",
      url: "https://hello.fullsail.edu/brand-1-technology",
      start: new Date("11/01/2009"),
      end: new Date("03/01/2012"),
      location: {
        formatted: "Winter Park, FL",
        unformatted: "Winter Park, FL",
      },
      skills: [
        SKILLS.JAVASCRIPT,
        SKILLS.PHP,
        SKILLS.HTML,
        SKILLS.CSS,
        SKILLS.ACTION_SCRIPT,
      ],
    },
  ],
} as ResumeInterface;
