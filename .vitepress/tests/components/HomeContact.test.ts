import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";

vi.mock("@data/resume", () => ({
  default: {},
  CURRENT_LOCATION: "Reno, NV",
}));

import HomeContact from "@components/HomeContact.vue";

describe("HomeContact", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(HomeContact);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
