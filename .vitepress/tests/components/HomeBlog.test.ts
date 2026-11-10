import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockPosts } from "../__fixtures__/mockData";

vi.mock("@utils/formatDate", () => ({
  formatPostDateFor: () => "January 1, 2025",
}));

import HomeBlog from "@components/HomeBlog.vue";

describe("HomeBlog", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(HomeBlog, { props: { posts: mockPosts } });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
