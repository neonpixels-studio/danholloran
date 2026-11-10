import { describe, it, expect } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockPosts } from "../__fixtures__/mockData";

// Unlike HomeBlog.test.ts this does not mock formatDate: the real formatter
// must honor each post's load-time dateIsValid flag.
const [featuredPost, secondPost] = mockPosts;
const flaggedFeatured = { ...featuredPost, dateIsValid: false };
const flaggedRecent = { ...secondPost, dateIsValid: false };

import HomeBlog from "@components/HomeBlog.vue";

describe("HomeBlog date validity", () => {
  it("formats valid dates for the featured and recent posts", () => {
    const text = shallowMount(HomeBlog, {
      props: { posts: [featuredPost, secondPost] },
    }).text();
    expect(text).toContain("Jan 1, 2025");
    expect(text).toContain("Feb 1, 2025");
    expect(text).not.toContain("Unknown date");
  });

  it("renders the fallback for a featured post flagged invalid", () => {
    const text = shallowMount(HomeBlog, {
      props: { posts: [flaggedFeatured, secondPost] },
    }).text();
    expect(text).toContain("Unknown date");
    expect(text).not.toContain("Jan 1, 2025");
    expect(text).toContain("Feb 1, 2025");
  });

  it("renders the fallback for a recent post flagged invalid", () => {
    const text = shallowMount(HomeBlog, {
      props: { posts: [featuredPost, flaggedRecent] },
    }).text();
    expect(text).toContain("Unknown date");
    expect(text).not.toContain("Feb 1, 2025");
    expect(text).toContain("Jan 1, 2025");
  });
});
