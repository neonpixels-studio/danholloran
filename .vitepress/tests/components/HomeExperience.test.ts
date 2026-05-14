import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockResume } from "../__fixtures__/mockData";

vi.mock("@data/resume", () => ({
  default: mockResume,
}));

import HomeExperience from "@components/HomeExperience.vue";

describe("HomeExperience", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(HomeExperience);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
