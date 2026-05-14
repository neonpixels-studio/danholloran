import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";

vi.mock("vitepress", () => ({
  useRoute: () => ({ path: "/missing-page" }),
}));

vi.mock("@composables/useRevealAnimations", () => ({
  useRevealAnimations: vi.fn(),
}));

vi.mock("@data/resume", () => ({
  getExperienceLength: () => 14,
}));

import NotFoundView from "@views/NotFoundView.vue";

describe("NotFoundView", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(NotFoundView);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
