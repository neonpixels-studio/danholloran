import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockPosts } from "../__fixtures__/mockData";

// Unlike HomeBlog.test.ts this does not mock formatDate: the real formatter
// must honor each post's load-time dateIsValid flag.
const [featuredPost, secondPost] = mockPosts;
const flaggedFeatured = { ...featuredPost, dateIsValid: false };
const flaggedRecent = { ...secondPost, dateIsValid: false };

const dataMock = vi.hoisted(() => ({ posts: [] as unknown[] }));

vi.mock("@content/posts/posts.data.ts", () => ({
  get data() {
    return dataMock.posts;
  },
}));

import HomeBlog from "@components/HomeBlog.vue";

describe("HomeBlog date validity", () => {
  it("formats valid dates for the featured and recent posts", () => {
    dataMock.posts = [featuredPost, secondPost];
    const text = shallowMount(HomeBlog).text();
    expect(text).toContain("Jan 1, 2025");
    expect(text).toContain("Feb 1, 2025");
    expect(text).not.toContain("Unknown date");
  });

  it("renders the fallback for a featured post flagged invalid", () => {
    dataMock.posts = [flaggedFeatured, secondPost];
    const text = shallowMount(HomeBlog).text();
    expect(text).toContain("Unknown date");
    expect(text).not.toContain("Jan 1, 2025");
    expect(text).toContain("Feb 1, 2025");
  });

  it("renders the fallback for a recent post flagged invalid", () => {
    dataMock.posts = [featuredPost, flaggedRecent];
    const text = shallowMount(HomeBlog).text();
    expect(text).toContain("Unknown date");
    expect(text).not.toContain("Feb 1, 2025");
    expect(text).toContain("Jan 1, 2025");
  });
});
