import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockPosts } from "../__fixtures__/mockData";

vi.mock("@content/posts/posts.data.ts", () => ({
  data: mockPosts,
}));

vi.mock("@utils/formatDate", () => ({
  formatPostDate: () => "January 1, 2025",
}));

import HomeBlog from "@components/HomeBlog.vue";

describe("HomeBlog", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(HomeBlog);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
