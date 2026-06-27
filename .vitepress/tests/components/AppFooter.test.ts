import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";

const routeState = { path: "/" };
vi.mock("vitepress", () => ({
  useRoute: () => routeState,
}));

import AppFooter from "@components/AppFooter.vue";

describe("AppFooter", () => {
  it("renders correctly", () => {
    routeState.path = "/";
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("is not forced dark on a normal page", () => {
    routeState.path = "/resume";
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.find("footer").classes()).not.toContain("dark");
  });

  it("forces dark on the Grimicorn Neon page", () => {
    routeState.path = "/themes/grimicorn-neon";
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.find("footer").classes()).toContain("dark");
  });
});
