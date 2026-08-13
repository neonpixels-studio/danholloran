import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockResume, mockPosts } from "../__fixtures__/mockData";

vi.mock("@data/resume.ts", () => ({
  default: mockResume,
}));

import PostView from "@views/PostView.vue";
import PostLightbox from "@components/PostLightbox.vue";

describe("PostView", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(PostView, {
      props: {
        post: mockPosts[0],
        posts: mockPosts,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders with prev and next navigation when post is mid-list", () => {
    const [first, second] = mockPosts;
    const threePosts = [
      first,
      second,
      {
        ...second,
        url: "/posts/third",
        frontmatter: {
          ...second.frontmatter,
          slug: "third",
          title: "Third Post",
        },
      },
    ];
    const wrapper = shallowMount(PostView, {
      props: {
        post: threePosts[1],
        posts: threePosts,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("shows the finance disclaimer for finance posts", () => {
    const financePost = {
      ...mockPosts[0],
      frontmatter: { ...mockPosts[0].frontmatter, topic: "finance" },
    };
    const wrapper = shallowMount(PostView, {
      props: { post: financePost, posts: [financePost] },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("hides the finance disclaimer for non-finance posts", () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    expect(wrapper.find("aside[aria-label='Disclaimer']").exists()).toBe(false);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("opens the lightbox with the hero image when it is clicked", async () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(null);

    await wrapper
      .find(`img[src='${mockPosts[0].frontmatter.image}']`)
      .trigger("click");

    const lightbox = wrapper.findComponent(PostLightbox);
    expect(lightbox.props("src")).toBe(mockPosts[0].frontmatter.image);
    expect(lightbox.props("alt")).toBe(mockPosts[0].frontmatter.title);
  });

  it("closes the lightbox when PostLightbox emits close", async () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    await wrapper
      .find(`img[src='${mockPosts[0].frontmatter.image}']`)
      .trigger("click");
    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(
      mockPosts[0].frontmatter.image,
    );

    wrapper.findComponent(PostLightbox).vm.$emit("close");
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(null);
  });

  it("prioritizes the hero image and reserves its space without lazy loading", () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    const hero = wrapper.find(`img[src='${mockPosts[0].frontmatter.image}']`);

    // Hero is the LCP: prioritize its fetch and never defer it.
    expect(hero.attributes("fetchpriority")).toBe("high");
    expect(hero.attributes("loading")).toBeUndefined();
    // The aspect-video wrapper reserves the hero's box before it loads, so the
    // hero needs no intrinsic width/height to avoid CLS.
    expect(hero.element.parentElement?.className).toContain("aspect-video");
  });

  it("links each tag to /posts?tag=TAG", () => {
    const wrapper = shallowMount(PostView, {
      props: {
        post: mockPosts[0],
        posts: mockPosts,
      },
    });
    const tagLinks = wrapper.findAll("a[href^='/posts?tag=']");
    expect(tagLinks).toHaveLength(mockPosts[0].frontmatter.tags.length);
    tagLinks.forEach((link, i) => {
      expect(link.attributes("href")).toBe(
        `/posts?tag=${mockPosts[0].frontmatter.tags[i]}`,
      );
    });
  });
});
