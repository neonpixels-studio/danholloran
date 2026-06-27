import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";

const frontmatterState = { value: {} as Record<string, unknown> };
vi.mock("vitepress", () => ({
  useData: () => ({ frontmatter: frontmatterState }),
}));

import AppFooter from "@components/AppFooter.vue";

describe("AppFooter", () => {
  it("renders correctly", () => {
    frontmatterState.value = {};
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("is not forced dark without the frontmatter flag", () => {
    frontmatterState.value = {};
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.find("footer").classes()).not.toContain("dark");
  });

  it("forces dark when frontmatter sets forceDarkFooter", () => {
    frontmatterState.value = { forceDarkFooter: true };
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.find("footer").classes()).toContain("dark");
  });
});
