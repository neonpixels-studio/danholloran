import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockProjects } from "../__fixtures__/mockData";

vi.mock("@data/projects", () => ({
  default: mockProjects,
}));

import HomeProjects from "@components/HomeProjects.vue";

describe("HomeProjects", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(HomeProjects);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("opens external project links in a new tab", () => {
    const wrapper = shallowMount(HomeProjects);
    const externalLink = wrapper.get('a[href="https://acme.example"]');
    expect(externalLink.attributes("target")).toBe("_blank");
    expect(externalLink.attributes("rel")).toBe("noopener");
  });
});
