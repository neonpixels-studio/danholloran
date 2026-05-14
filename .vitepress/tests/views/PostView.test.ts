import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockResume, mockPosts } from "../__fixtures__/mockData";

vi.mock("@data/resume.ts", () => ({
  default: mockResume,
}));

import PostView from "@views/PostView.vue";

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
});
