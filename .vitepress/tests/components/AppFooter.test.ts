import { describe, it, expect } from "vitest";
import { shallowMount } from "@vue/test-utils";
import AppFooter from "@components/AppFooter.vue";

describe("AppFooter", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
