import { describe, it, expect, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockPosts } from "../__fixtures__/mockData";

import PostsView from "@views/PostsView.vue";

beforeEach(() => {
  window.location.href = "http://localhost/posts";
});

describe("PostsView", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(PostsView, {
      props: { posts: mockPosts },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders with empty posts list", () => {
    const wrapper = shallowMount(PostsView, {
      props: { posts: [] },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders with tag filter applied from URL", () => {
    window.location.href = "http://localhost/posts?tag=javascript";
    const wrapper = shallowMount(PostsView, {
      props: { posts: mockPosts },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders no-posts message when filters match nothing", () => {
    window.location.href = "http://localhost/posts?tag=nonexistent";
    const wrapper = shallowMount(PostsView, {
      props: { posts: mockPosts },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders with topic filter applied from URL", () => {
    window.location.href = "http://localhost/posts?topic=career";
    const wrapper = shallowMount(PostsView, {
      props: { posts: mockPosts },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
