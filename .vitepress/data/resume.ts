import type { ResumeInterface } from "@typedefs";
import skills from "./skills";
import pastLocations from "./past-locations.json";

export const getExperienceLength = () => {
  return new Date().getFullYear() - 2012;
};

// Single source of truth lives in constants.ts (derived from location.json).
// Use a relative path (not the @utils alias): this module is pulled into the
// VitePress config bundle, where aliases aren't resolved yet.
export { CURRENT_LOCATION } from "../theme/utils/constants";
import { CURRENT_LOCATION } from "../theme/utils/constants";

export const PAST_LOCATIONS = Object.freeze([...new Set(pastLocations)]);

export default {
  firstName: "Danny",
  lastName: "Holloran",
  photo: "/images/profile.png",
  headline: "Senior Frontend & Fullstack Developer",
  intro: `Senior Frontend & Fullstack Developer with ${getExperienceLength()}+ years building performant, scalable web applications. Passionate about architecture, mentorship, and finding the right tool for the job.`,
  summary: `Dynamic Senior Frontend &amp; Fullstack Developer with <strong class="text-fg font-semibold">${getExperienceLength()}+ years</strong> of experience building responsive, performant web applications and leading engineering teams. Proven track record of reducing load times, improving user engagement, and directing cross-functional teams of 10+ developers. Equally comfortable owning complex frontend architecture with Vue.js and React, diving into Fullstack work with Laravel and PHP, or stepping into an engineering leadership role. I build and operate my own AI agent tooling and fold AI coding agents into my daily development workflow, with 5+ years of TypeScript across Vue/Nuxt and React work. Looking to bring deep technical expertise and a collaborative leadership style to an innovative startup or mid-sized product team, remotely.`,
  contacts: [
    {
      link: "tel:3148828326",
      label: "(314) 882-8326",
    },
    {
      link: "mailto:hello@danholloran.me",
      label: "hello@danholloran.me",
    },
    {
      link: "https://danholloran.me",
      label: "danholloran.me",
    },
    {
      link: "https://github.com/grimicorn",
      label: "github.com/grimicorn",
    },
    {
      link: "https://instagram.com/grimicornsparkles/",
      label: "@grimicornsparkles",
    },
    {
      link: "https://linkedin.com/in/dan-holloran/",
      label: "linkedin.com/in/dan-holloran",
    },
    {
      label: CURRENT_LOCATION,
    },
  ],
  skills() {
    return [
      ...new Set(
        [...this.experience, ...this.education]
          .map(({ skills }) => skills)
          .flat(),
      ),
    ].sort((a, b) => a.name.localeCompare(b.name));
  },
  experience: [
    {
      role: "Senior Fullstack Developer",
      company: "Ample",
      start: new Date("09/29/2025"),
      end: null,
      url: "https://ample.co",
      location: "Cincinnati, OH",
      remote: true,
      details: [
        "Architected and maintain crossroads.net, driving ongoing performance improvements and reducing technical debt across a modern JavaScript stack",
        "Collaborate cross-functionally with designers, translating product requirements into polished frontend experience",
        "Lead pair programming sessions and code reviews to elevate team code quality and accelerate junior developer growth",
        "Drive adoption of AI coding agents across the team, running Claude Code as the primary workflow for backend feature development and bringing AI-authored changes through pairing and code review",
        "Leveraged AI agents to close testing gaps that time constraints previously left open: built a full Playwright e2e suite (sign-in, sign-up, password reset, profile updates) for an inherited, half-finished Auth0 integration, and codified always-on unit tests in a project CLAUDE.md so agent-written code ships tested and reviewable by default",
      ],
      skills: [
        skills.AI_DEVELOPMENT,
        skills.ARCHITECTURE,
        skills.GATSBY,
        skills.GIT,
        skills.GITHUB,
        skills.GRAPHQL,
        skills.JAMSTACK,
        skills.MENTORSHIP,
        skills.NEXT_JS,
        skills.NODE_JS,
        skills.REACT,
        skills.TAILWIND_CSS,
        skills.TYPESCRIPT,
        skills.RUBY,
      ],
    },
    {
      role: "Creator & Maintainer",
      company: "AI Automation Platform (Personal Project)",
      start: new Date("06/01/2025"),
      end: null,
      url: "/posts/turning-a-base-m4-mac-mini-into-an-always-on-automation-box",
      location: "St. Louis, MO",
      remote: true,
      details: [
        "Designed and operate ~10 scheduled AI agent skills on an always-on Mac mini server, automating real workflows: blog cross-posting, SEO and accessibility audits, and content ingestion",
        "Run an issue-to-PR agent workflow where agents author branches overnight through a dedicated bot account and I review every PR, gated by CLAUDE.md guidelines and a deterministic codebase audit (dead code, duplication, boundary drift) in CI and pre-commit",
        "Built deterministic safety tooling around the agents: a packaging/publish guard that blocks destructive operations, secret scanning (gitleaks) and dependency audits (npm audit) in CI, all wired into pre-commit hooks",
        "Write publicly about AI-assisted development at danholloran.me",
      ],
      skills: [
        skills.AI_DEVELOPMENT,
        skills.ARCHITECTURE,
        skills.GIT,
        skills.GITHUB,
        skills.NODE_JS,
        skills.TYPESCRIPT,
      ],
    },
    {
      role: "Career Sabbatical",
      company: "Life",
      start: new Date("03/15/2025"),
      end: new Date("09/28/2025"),
      url: "https://instagram.com/grimicornsparkles",
      location: "United States",
      remote: true,
      details: [
        "My position was eliminated and decided to take it as a career sabbatical to travel, recharge, and return with a fresh perspective and renewed focus.",
      ],
      skills: [skills.PHOTOGRAPHY],
    },
    {
      role: "Senior Frontend Developer",
      company: "Tradier",
      start: new Date("02/29/2021"),
      end: new Date("03/15/2025"),
      url: "https://tradier.com",
      location: "Charlotte, NC",
      remote: true,
      details: [
        "Redesigned frontend platform architecture, achieving a 25% improvement in load times and a measurable lift in user engagement metrics",
        "Built dynamic, high-performance single-page applications using Vue, Nuxt, and Tailwind CSS, reducing bounce rates by 10%",
        "Mentored 2 junior developers through structured code reviews and pair programming, fostering a culture of continuous learning and shared ownership",
        "Partnered closely with UX/UI designers to translate wireframes into polished, responsive web applications, boosting overall user experience",
      ],
      skills: [
        skills.ARCHITECTURE,
        skills.CYPRESS,
        skills.GIT,
        skills.GITHUB,
        skills.JAMSTACK,
        skills.LEADERSHIP,
        skills.MENTORSHIP,
        skills.NODE_JS,
        skills.NUXT,
        skills.TAILWIND_CSS,
        skills.TYPESCRIPT,
        skills.VUE_JS,
        skills.WEBSOCKETS,
      ],
    },
    {
      role: "Senior Fullstack Developer / Lead Developer",
      company: "Ample",
      start: new Date("10/31/2019"),
      end: new Date("02/29/2021"),
      url: "https://ample.co",
      location: "Cincinnati, OH",
      remote: true,
      details: [
        "Assisted a key client in transitioning to online services during COVID-19, resulting in a 35% increase in web property usage virtually overnight",
        "Directed engineering operations for a team of 10 developers, owning technical decision-making, roadmap prioritization, and cross-team collaboration",
        "Implemented agile methodologies that streamlined development workflows, resulting in a 20% increase in project delivery speed",
        "Oversaw architecture and implementation of complex web applications using React and Gatsby, improving both user experience and system performance",
      ],
      skills: [
        skills.ARCHITECTURE,
        skills.GATSBY,
        skills.GRAPHQL,
        skills.JAMSTACK,
        skills.LEADERSHIP,
        skills.MENTORSHIP,
        skills.NEXT_JS,
        skills.NODE_JS,
        skills.REACT,
        skills.REST_API,
        skills.RUBY,
        skills.TYPESCRIPT,
      ],
    },
    {
      role: "Full Stack Developer / Lead Developer",
      company: "Matchbox Design Group",
      start: new Date("11/01/2012"),
      end: new Date("10/31/2019"),
      url: "https://matchboxdesigngroup.com",
      location: "St. Louis, MO",
      remote: false,
      details: [
        "Optimized website performance across 50+ client projects, achieving 90+ scores on Google PageSpeed Insights and reducing average bounce rates by 25%",
        "Integrated AS400 inventory systems to automate real-time product updates, eliminating manual processes and reliably meeting complex client data requirements",
        "Led cross-functional teams in the planning and execution of strategic web initiatives, delivering a 15% increase in project efficiency",
        "Built intuitive, user-friendly websites using WordPress, Laravel, Vue, and PHP, successfully delivering 50+ projects on time and within scope",
      ],
      skills: [
        skills.ARCHITECTURE,
        skills.LARAVEL,
        skills.LEADERSHIP,
        skills.MENTORSHIP,
        skills.MYSQL,
        skills.NODE_JS,
        skills.POSTGRESQL,
        skills.SASS,
        skills.TAILWIND_CSS,
        skills.VUE_JS,
        skills.WORDPRESS,
      ],
    },
    {
      role: "Web Developer",
      company: "Freeman Marketing",
      start: new Date("05/01/2012"),
      end: new Date("10/31/2012"),
      url: "https://freemanmarketinginc.com",
      location: "St. Louis, MO",
      remote: false,
      details: [
        "Built and launched 3–5 custom WordPress sites for local businesses from Photoshop designs, with on-page SEO, and mentored a web development intern.",
      ],
      skills: [skills.MENTORSHIP, skills.SASS, skills.WORDPRESS],
    },
  ],
  education: [
    {
      degree: "Bachelor of Science",
      field: "Web Design and Development",
      school: "Full Sail University",
      url: "https://hello.fullsail.edu/brand-1-technology",
      start: new Date("11/01/2009"),
      end: new Date("03/01/2012"),
      location: "Winter Park, FL",
      remote: true,
      skills: [
        skills.JAVASCRIPT,
        skills.PHP,
        skills.HTML,
        skills.CSS,
        skills.ACTION_SCRIPT,
      ],
    },
  ],
} as ResumeInterface;
