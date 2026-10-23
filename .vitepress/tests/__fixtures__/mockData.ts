import type {
  ResumeInterface,
  ProjectInterface,
  SkillsMap,
  QuoteInterface,
  Post,
  SearchItem,
} from "@typedefs";
export const mockSkill = {
  image: "vue-js.svg",
  name: "Vue.js",
  url: "https://vuejs.org",
  featured: true,
};

export const mockSkills: SkillsMap = {
  VUE_JS: mockSkill,
  REACT: {
    image: "react.svg",
    name: "React.js",
    url: "https://react.dev",
    featured: false,
  },
};

export const mockResume: ResumeInterface = {
  firstName: "Jane",
  shortFirstName: "Jan",
  lastName: "Doe",
  photo: "/images/photo.jpg",
  headline: "Senior Frontend Developer",
  intro: "Building great things on the web.",
  summary: "A summary of skills and experience.",
  contacts: [{ label: "jane@example.com" }, { label: "GitHub" }],
  skills: () => [mockSkill],
  experience: [
    {
      role: "Lead Developer",
      company: "Acme Corp",
      start: new Date("2022-01-01"),
      end: null,
      url: "https://acme.example",
      location: "Remote",
      remote: true,
      details: ["Built things", "Shipped features"],
      skills: [mockSkill],
    },
  ],
  education: [
    {
      degree: "B.S.",
      field: "Computer Science",
      school: "State University",
      url: "https://university.example",
      start: new Date("2007-09-01"),
      end: new Date("2011-05-15"),
      location: "Springfield",
      remote: false,
      skills: [mockSkill],
    },
  ],
};

export const mockProjects: ProjectInterface[] = [
  {
    company: "Acme Corp",
    image: "/images/projects/acme.png",
    url: "https://acme.example",
    skills: [mockSkill],
    title: "Acme Project",
    content: "A featured project.",
    featured: true,
  },
  {
    company: "Other Co",
    image: "/images/projects/other.png",
    skills: [mockSkill],
    title: "Side Project",
    content: "A non-featured project.",
    featured: false,
  },
];

// Single-item array so Math.random() selection is always index 0
export const mockQuotes: QuoteInterface[] = [
  {
    content: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
];

export const mockPosts: Post[] = [
  {
    url: "/posts/first-post",
    dateIsValid: true,
    frontmatter: {
      title: "First Post",
      slug: "first-post",
      image: "/images/posts/first-post.jpg",
      draft: false,
      topic: "development",
      date: "2025-01-01T00:00:00.000Z",
      description: "The first post description.",
      tags: ["javascript"],
      readTime: 5,
    },
  },
  {
    url: "/posts/second-post",
    dateIsValid: true,
    frontmatter: {
      title: "Second Post",
      slug: "second-post",
      image: "/images/posts/second-post.jpg",
      draft: false,
      topic: "career",
      date: "2025-02-01T00:00:00.000Z",
      description: "The second post description.",
      tags: ["career"],
      readTime: 3,
    },
  },
];

export const mockSearchItems: SearchItem[] = [
  {
    type: "post",
    title: "First Post",
    desc: "The first post description.",
    href: "/posts/first-post",
    kw: "javascript first post",
  },
];

export const mockStaticSearchItems: SearchItem[] = [
  {
    type: "page",
    title: "Resume",
    desc: "Full professional history & download",
    href: "/resume",
    kw: "resume cv work history",
  },
  {
    type: "project",
    title: "Acme Project",
    desc: "Acme Corp",
    href: "https://acme.example",
    kw: "Acme Corp Vue.js A featured project.",
  },
  // Collides with the "/posts/first-post" post entry to exercise deduping.
  {
    type: "project",
    title: "Duplicate Of First Post",
    desc: "Collision",
    href: "/posts/first-post",
    kw: "duplicate collision project",
  },
];

export const mockSocialLinks = Object.freeze({
  GITHUB: "https://github.com/testuser",
  LINKEDIN: "https://linkedin.com/in/testuser/",
  X: "https://x.com/testuser",
  BLUE_SKY: "https://bsky.app/profile/testuser.bsky.social",
});

export const mockNavItems = [
  { label: "Blog", link: "/posts/", isActive: () => false },
  { label: "Resume", link: "/resume", isActive: () => false },
];
