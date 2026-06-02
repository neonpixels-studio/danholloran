import type { ResumeInterface } from "@typedefs";
import skills from "./skills";
import location from "./location.json";

export const getExperienceLength = () => {
  return new Date().getFullYear() - 2012;
};

export const CURRENT_LOCATION = `${location.city}, ${location.state}`;

export default {
  firstName: "Dan",
  lastName: "Holloran",
  photo: "/images/profile.png",
  headline: "Senior Frontend & Fullstack Developer",
  intro: `Senior Full Stack Developer with ${getExperienceLength()}+ years building performant, scalable web applications. Passionate about architecture, mentorship, and finding the right tool for the job.`,
  summary: `Dynamic Senior Frontend &amp; Fullstack Developer with <strong class="text-fg font-semibold">${getExperienceLength()}+ years</strong> of experience building responsive, performant web applications and leading engineering teams. Proven track record of reducing load times, improving user engagement, and directing cross-functional teams of 10+ developers. Equally comfortable owning complex frontend architecture with Vue.js and React, diving into Fullstack work with Laravel and PHP, or stepping into an engineering leadership role. Looking to bring deep technical expertise and a collaborative leadership style to an innovative startup or mid-sized product team — remotely.`,
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
        "Evaluate and integrate emerging AI tools and workflows to accelerate feature development cycles and improve overall team efficiency",
      ],
      skills: [
        skills.ARCHITECTURE,
        skills.GATSBY,
        skills.GRAPHQL,
        skills.JAMSTACK,
        skills.MENTORSHIP,
        skills.NEXT_JS,
        skills.NODE_JS,
        skills.REACT,
        skills.RUBY,
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
        skills.JAMSTACK,
        skills.LEADERSHIP,
        skills.MENTORSHIP,
        skills.NODE_JS,
        skills.NUXT,
        skills.RUBY,
        skills.TAILWIND_CSS,
        skills.VUE_JS,
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
        "Championed career development initiatives across the team, creating targeted growth plans that helped engineers build new technical skills and advance their careers",
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
        "Established streamlined client communication workflows that reduced friction, improved collaboration, and cut launch times by 15%",
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
        "Built and launched 3–5 custom WordPress websites for local business clients, translating Photoshop designs into responsive, production-ready builds with on-page SEO implementation.",
        "Mentored a web development intern, providing hands-on guidance and code feedback throughout the engagement.",
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
