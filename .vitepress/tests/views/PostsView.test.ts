import { describe, it, expect } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockPosts } from "../__fixtures__/mockData";

import PostsView from "@views/PostsView.vue";

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
});
