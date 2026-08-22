import type {
  ResumeInterface,
  ProjectInterface,
  SkillsMap,
  QuoteInterface,
  Post,
  SearchItem,
} from "@typedefs";
import type { InstagramPost } from "@typedefs";

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

// Single image per post so Math.random() selection is always index 0.
// createContentLoader wraps each item with a `frontmatter` key.
export const mockInstagramPosts = [
  {
    url: "/content/instagram/photo1",
    frontmatter: {
      created_at: "2025-01-01T00:00:00.000Z",
      caption: "A great photo",
      tags: ["nature"],
      location: "Yosemite",
      images: [
        "/images/instagram/photo1-a.jpg",
        "/images/instagram/photo1-b.jpg",
      ],
      url: "https://instagram.com/p/abc123",
    } as InstagramPost,
  },
  {
    url: "/content/instagram/photo2",
    frontmatter: {
      created_at: "2025-02-01T00:00:00.000Z",
      caption: "Another great photo",
      tags: ["travel"],
      location: "Grand Canyon",
      images: [
        "/images/instagram/photo2-a.jpg",
        "/images/instagram/photo2-b.jpg",
      ],
      url: "https://instagram.com/p/def456",
    } as InstagramPost,
  },
];

export const mockSocialLinks = Object.freeze({
  GITHUB: "https://github.com/testuser",
  INSTAGRAM: "https://instagram.com/testuser/",
  LINKEDIN: "https://linkedin.com/in/testuser/",
});

export const mockNavItems = [
  { label: "Blog", link: "/posts/", isActive: () => false },
  { label: "Resume", link: "/resume", isActive: () => false },
];
