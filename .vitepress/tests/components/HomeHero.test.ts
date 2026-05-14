import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockResume, mockQuotes, mockSkills } from "../__fixtures__/mockData";

vi.mock("@data/resume", () => ({
  default: mockResume,
  CURRENT_LOCATION: "Reno, NV",
}));

vi.mock("@data/quotes", () => ({
  default: mockQuotes,
}));

vi.mock("@data/skills.ts", () => ({
  default: mockSkills,
}));

import HomeHero from "@components/HomeHero.vue";

describe("HomeHero", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(HomeHero);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
