import { describe, it, expect } from "vitest";
import { mount, shallowMount } from "@vue/test-utils";
import type { Post } from "@typedefs";
import { mockPosts } from "../__fixtures__/mockData";
import { buildArchiveView } from "@utils/postViews";

import PostsView from "@views/PostsView.vue";

// A larger set than mockPosts so pagination (first page = 10, rest = 9) can be
// exercised. 21 posts => 3 pages.
function buildPosts(count: number): Post[] {
  return Array.from({ length: count }, (_unused, index) => ({
    url: `/posts/post-${index}`,
    dateIsValid: true,
    frontmatter: {
      title: `Post ${index}`,
      slug: `post-${index}`,
      image: `/images/posts/post-${index}.jpg`,
      draft: false,
      topic: index % 2 === 0 ? "development" : "travel",
      date: `2025-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      description: `Description ${index}.`,
      tags: index % 3 === 0 ? ["javascript"] : ["css"],
      readTime: 5,
    },
  }));
}

type ArchiveRoute = {
  topic?: string;
  tag?: string;
  tagLabel?: string;
  page?: number;
};

// The props an archive route passes PostsView: its params plus the slice
// postPageData.ts builds for it at build time.
function archiveProps(posts: Post[], route: ArchiveRoute = {}) {
  return { ...route, view: buildArchiveView(posts, route) };
}

function anchorHrefs(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

describe("PostsView", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(PostsView, { props: archiveProps(mockPosts) });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("crops thumbnails to their 16:9 box instead of stretching them", () => {
    const wrapper = shallowMount(PostsView, { props: archiveProps(mockPosts) });
    const thumbnails = wrapper.findAll("responsive-image-stub");

    expect(thumbnails.length).toBeGreaterThan(0);
    thumbnails.forEach((thumbnail) =>
      expect(thumbnail.classes()).toContain("object-cover"),
    );
  });

  it("renders the header and lead card visible and prioritizes the lead thumbnail", () => {
    const wrapper = shallowMount(PostsView, { props: archiveProps(mockPosts) });
    const cards = wrapper.findAll("a.fade-in");
    const thumbnails = wrapper.findAll("responsive-image-stub");

    // The fade observer is client-only, so anything without `visible` here
    // stays at opacity 0 until hydration, delaying LCP.
    expect(wrapper.find("header.fade-in").classes()).toContain("visible");
    expect(cards[0].classes()).toContain("visible");
    expect(thumbnails[0].attributes("fetchpriority")).toBe("high");
    expect(thumbnails[0].attributes("loading")).toBeUndefined();
  });

  it("leaves later cards to the fade observer and lazy-loads their thumbnails", () => {
    const wrapper = shallowMount(PostsView, { props: archiveProps(mockPosts) });
    const cards = wrapper.findAll("a.fade-in");
    const thumbnails = wrapper.findAll("responsive-image-stub");

    expect(cards.length).toBeGreaterThan(1);
    expect(cards[1].classes()).not.toContain("visible");
    expect(thumbnails[1].attributes("fetchpriority")).toBeUndefined();
    expect(thumbnails[1].attributes("loading")).toBe("lazy");
  });

  it("renders with empty posts list", () => {
    const wrapper = shallowMount(PostsView, { props: archiveProps([]) });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("filters by the topic slug prop", () => {
    const wrapper = mount(PostsView, {
      props: archiveProps(mockPosts, { topic: "development" }),
    });
    // Only the development post (first-post) survives the topic filter.
    const postLinks = anchorHrefs(wrapper.html()).filter((href) =>
      href.startsWith("/posts/first-post"),
    );
    expect(postLinks.length).toBe(1);
    expect(wrapper.html()).not.toContain("/posts/second-post");
  });

  it("filters by the tag slug prop", () => {
    const wrapper = mount(PostsView, {
      props: archiveProps(mockPosts, {
        tag: "javascript",
        tagLabel: "javascript",
      }),
    });
    expect(wrapper.html()).toContain("/posts/first-post");
    expect(wrapper.html()).not.toContain("/posts/second-post");
    // The active tag chip clears back to the archive root.
    expect(wrapper.html()).toContain("#javascript");
  });

  it("renders the no-posts message with a clear-filters link", () => {
    const wrapper = mount(PostsView, {
      props: archiveProps(mockPosts, { tag: "nonexistent" }),
    });
    const emptyBlock = wrapper.get(".text-center");
    expect(emptyBlock.text()).toContain("No posts found");
    expect(emptyBlock.get("a").attributes("href")).toBe("/posts/");
  });

  it("renders real pagination links to numbered pages", () => {
    const wrapper = mount(PostsView, { props: archiveProps(buildPosts(21)) });
    const hrefs = anchorHrefs(wrapper.html());
    // 21 posts => pages 1..3; page 1 links to /posts/page/2 and /posts/page/3.
    expect(hrefs).toContain("/posts/page/2");
    expect(hrefs).toContain("/posts/page/3");
    // Page 1 shows the first 10 posts (featured lead + 9).
    expect(wrapper.html()).toContain("/posts/post-0");
    expect(wrapper.html()).not.toContain("/posts/post-10");
  });

  it("renders the correct slice and a scoped previous-page link for a later page", () => {
    const wrapper = mount(PostsView, {
      props: archiveProps(buildPosts(21), { page: 2 }),
    });
    // Page 2 holds posts 10..18 (9 posts).
    expect(wrapper.html()).toContain("/posts/post-10");
    expect(wrapper.html()).not.toContain('/posts/post-0"');
    // The previous-page control (scoped to the pagination nav) points at page 1.
    const pagination = wrapper.get('nav[aria-label="Archive pagination"]');
    expect(anchorHrefs(pagination.html())).toContain("/posts/");
    // A later unfiltered page gets a distinct H1 instead of the page-1 hero.
    expect(wrapper.get("h1").text()).toBe("Writing — Page 2");
  });

  it("normalizes a malformed page param to page 1 instead of an empty slice", () => {
    const wrapper = mount(PostsView, {
      props: archiveProps(buildPosts(21), { page: Number("nope") }),
    });
    // NaN page must not slice out an empty archive; page 1 content shows.
    expect(wrapper.html()).toContain("/posts/post-0");
    const pagination = wrapper.get('nav[aria-label="Archive pagination"]');
    expect(anchorHrefs(pagination.html())).toContain("/posts/page/2");
  });

  it("scopes pagination links to the active topic filter", () => {
    const posts = buildPosts(40).map((post) => ({
      ...post,
      frontmatter: { ...post.frontmatter, topic: "development" },
    }));
    const wrapper = mount(PostsView, {
      props: archiveProps(posts, { topic: "development" }),
    });
    const pagination = wrapper.get('nav[aria-label="Archive pagination"]');
    expect(anchorHrefs(pagination.html())).toContain(
      "/posts/topic/development/page/2",
    );
  });

  it("renders a distinct heading for a filtered archive page", () => {
    const topicWrapper = mount(PostsView, {
      props: archiveProps(mockPosts, { topic: "development" }),
    });
    expect(topicWrapper.get("h1").text()).toBe("Posts on development");

    const tagWrapper = mount(PostsView, {
      props: archiveProps(mockPosts, {
        tag: "javascript",
        tagLabel: "javascript",
      }),
    });
    expect(tagWrapper.get("h1").text()).toBe("Posts tagged #javascript");
  });

  it("renders the date fallback for a post flagged with an invalid date", () => {
    const [validPost, secondPost] = mockPosts;
    const flaggedPost = { ...secondPost, dateIsValid: false };
    const wrapper = shallowMount(PostsView, {
      props: archiveProps([validPost, flaggedPost]),
    });
    const text = wrapper.text();
    expect(text).toContain("Jan 1, 2025");
    expect(text).toContain("Unknown date");
    expect(text).not.toContain("Feb 1, 2025");
  });
});
