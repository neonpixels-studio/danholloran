import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockResume } from "../__fixtures__/mockData";

vi.mock("@composables/useRevealAnimations", () => ({
  useRevealAnimations: vi.fn(),
}));

vi.mock("@data/resume.ts", () => ({
  default: mockResume,
}));

import ResumeView from "@views/ResumeView.vue";

describe("ResumeView", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(ResumeView);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
