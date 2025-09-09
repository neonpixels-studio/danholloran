import {
  PhoneIcon,
  EnvelopeOpenIcon,
  UserIcon,
  MapPinIcon,
} from "@heroicons/vue/16/solid";
import { ResumeInterface } from "../../types/resume";
import { SKILLS } from "./skills";
import { HOBBIES } from "./hobbies";

export const LOCATION = {
  unformatted: "Reno, NV 89504",
  formatted: "Reno, NV 89504",
  icon: MapPinIcon,
};

export default {
  firstName: "Dan",
  lastName: "Holloran",
  photo: {
    url: "/images/headshot.png",
  },
  intro:
    "Dynamic Frontend Developer with 12+ years of experience in web development and project management, specializing in building responsive user interfaces with Vue and React. Proven leadership in mentoring developers, overseeing team growth, and enhancing collaboration and technical skills. Successfully improved frontend performance and user experience while managing complex projects across multiple platforms. Seeking to leverage expertise in a mid-sized team focused on innovative Web3 or AI projects.",
  contacts: [
    {
      unformatted: "3148828326",
      formatted: "(314) 882-8326",
      icon: PhoneIcon,
    },
    {
      unformatted: "hello@danholloran.me",
      formatted: "hello@danholloran.me",
      icon: EnvelopeOpenIcon,
    },
    {
      unformatted: "https://danholloran.me",
      formatted: "danholloran.me",
      icon: UserIcon,
    },
    LOCATION,
  ],
  skills() {
    // @todo How to type the sort()?
    return [
      ...new Set(
        [...this.experiences, ...this.educations]
          .map(({ skills }) => skills)
          .flat()
      ),
    ].sort((a, b) => a.name.localeCompare(b.name));
  },
  experiences: [
    {
      role: "Exploring",
      company: "Life",
      start: new Date("03/15/2025"),
      url: "/instagram/",
      location: {
        formatted: "United States",
        unformatted: "United States",
      },
      remote: true,
      details: [
        "Chasing Waterfalls",
        "Collecting National Park Stickers",
        "Making photos",
        "Refueling for my next adventure",
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
        formatted: "Charlotte, North Carolina",
        unformatted: "Charlotte, North Carolina",
      },
      remote: true,
      details: [
        "Optimized performance by replacing Ember applications with Vue applications, reducing feature development time from 2+ weeks to under a week.",
        "Enhanced frontend architecture for frontend platform, leading to 25% improvement in load times and user engagement metrics",
        "Produced dynamic, single-page applications utilizing proven and emerging technology, reducing bounce rates by 10%",
        "Mentored 2 junior developers while conducting code reviews, fostering a culture of continuous learning, and collaboration within the team",
        "Partnered with UX/UI designers to translate design wireframes into responsive, interactive web applications, boosting user experience",
      ],
      skills: [
        SKILLS.HTML,
        SKILLS.CSS,
        SKILLS.JAVASCRIPT,
        SKILLS.RUBY,
        SKILLS.NODE_JS,
        SKILLS.VUE_JS,
        SKILLS.NUXT,
        SKILLS.TAILWIND_CSS,
        SKILLS.GRAPHQL,
        SKILLS.REST_API,
        SKILLS.JAMSTACK,
        SKILLS.VITE,
        SKILLS.VITEST,
        SKILLS.JEST,
        SKILLS.CYPRESS,
        SKILLS.LEADERSHIP,
        SKILLS.MENTORSHIP,
        SKILLS.ARCHITECTURE,
      ],
    },
    {
      role: "Senior Fullstack Developer / Engineering Director",
      company: "Ample",
      start: new Date("10/31/2019"),
      end: new Date("02/29/2021"),
      url: "https://ample.co",
      location: {
        formatted: "Cincinnati, Ohio",
        unformatted: "Cincinnati, Ohio",
      },
      remote: true,
      details: [
        "Maximized reach by assisting a client to transition to online services and content during the COVID pandemic, resulting in a 35% bump in usage of web properties",
        "Directed engineering operations for a team of 10 developers to provide technical decision-making, driving project success and efficiency improvements through strategic leadership and collaboration",
        "Implemented agile methodologies to streamline development processes, resulting in a 20% increase in project delivery speed",
        "Oversaw the design and implementation of complex web applications using React and Gatsby, improving user experience and functionality",
        "Spearheaded career progression with targeted professional development, allowing team members to build technical skills",
      ],
      skills: [
        SKILLS.HTML,
        SKILLS.CSS,
        SKILLS.JAVASCRIPT,
        SKILLS.PHP,
        SKILLS.RUBY,
        SKILLS.NODE_JS,
        SKILLS.REACT,
        SKILLS.REDIS,
        SKILLS.GATSBY,
        SKILLS.NEXT_JS,
        SKILLS.GRAPHQL,
        SKILLS.REST_API,
        SKILLS.JAMSTACK,
        SKILLS.JEST,
        SKILLS.CYPRESS,
        SKILLS.LEADERSHIP,
        SKILLS.MENTORSHIP,
        SKILLS.ARCHITECTURE,
      ],
    },
    {
      role: "Full Stack Developer / Lead Developer",
      company: "Matchbox Design Group",
      start: new Date("11/01/2012"),
      end: new Date("10/31/2019"),
      url: "https://matchboxdesigngroup.com",
      location: {
        formatted: "St. Louis, Missouri",
        unformatted: "St. Louis, Missouri",
      },
      remote: false,
      details: [
        "Decreased bounce rates by an average of 25% by optimizing website performance, earning a 90+ score on Google PageSpeed Insights",
        "Facilitated automatic inventory updates by integrating AS400 systems, expertly meeting client needs",
        "Led cross-functional teams in the development and execution of strategic initiatives, leading to a 15% increase in project efficiency",
        "Generated intuitive and user-friendly custom websites with WordPress, Laravel, and Vue, successfully managing 50+ projects to stay within required deadlines",
        "Promoted seamless communication and workflow while working closely with diverse clients, cutting launch times by 15%",
      ],
      skills: [
        SKILLS.CSS,
        SKILLS.CYPRESS,
        SKILLS.HTML,
        SKILLS.JAVASCRIPT,
        SKILLS.JEST,
        SKILLS.LARAVEL,
        SKILLS.LEADERSHIP,
        SKILLS.MENTORSHIP,
        SKILLS.MYSQL,
        SKILLS.NODE_JS,
        SKILLS.PHP,
        SKILLS.POSTGRESQL,
        SKILLS.REDIS,
        SKILLS.REST_API,
        SKILLS.SASS,
        SKILLS.ARCHITECTURE,
        SKILLS.STATAMIC,
        SKILLS.TAILWIND_CSS,
        SKILLS.VUE_JS,
        SKILLS.WORDPRESS,
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
        formatted: "Winter Park, Florida",
        unformatted: "Winter Park, Florida",
      },
      skills: [
        SKILLS.JAVASCRIPT,
        SKILLS.PHP,
        SKILLS.HTML,
        SKILLS.CSS,
        SKILLS.HTML,
        SKILLS.ACTION_SCRIPT,
      ],
    },
  ],
} as ResumeInterface;
