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

  // useRevealAnimations is mocked, so anything still at opacity 0 here would
  // stay invisible until hydration, delaying LCP on the header and summary.
  it("renders above-the-fold reveals already visible, without waiting on JS", () => {
    const wrapper = shallowMount(ResumeView);
    const header = wrapper.find("header.reveal");
    const summary = wrapper.find("p.reveal");

    expect(header.classes()).toContain("in");
    expect(summary.classes()).toContain("in");
  });
});
