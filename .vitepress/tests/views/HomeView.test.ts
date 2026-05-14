import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import {
  mockResume,
  mockQuotes,
  mockSkills,
  mockProjects,
  mockPosts,
  mockInstagramPosts,
  mockSocialLinks,
} from "../__fixtures__/mockData";

// HomeView imports 6 child components whose modules must be resolvable even
// though shallowMount stubs their rendering. Mock all transitive data deps.
vi.mock("@composables/useRevealAnimations", () => ({
  useRevealAnimations: vi.fn(),
}));

vi.mock("@content/posts/posts.data.ts", () => ({ data: mockPosts }));
vi.mock("@content/instagram/instagram.data.ts", () => ({
  data: mockInstagramPosts,
}));
vi.mock("@data/resume", () => ({
  default: mockResume,
  CURRENT_LOCATION: "Reno, NV",
}));
vi.mock("@data/resume.ts", () => ({
  default: mockResume,
  CURRENT_LOCATION: "Reno, NV",
}));
vi.mock("@data/quotes", () => ({ default: mockQuotes }));
vi.mock("@data/skills.ts", () => ({ default: mockSkills }));
vi.mock("@data/projects", () => ({ default: mockProjects }));
vi.mock("@data/socialLinks.ts", () => ({ default: mockSocialLinks }));
vi.mock("@utils/formatDate", () => ({
  formatPostDate: () => "January 1, 2025",
}));

import HomeView from "@views/HomeView.vue";

describe("HomeView", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(HomeView);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
