import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import GrimicornWindowTitlebar from "@components/GrimicornWindowTitlebar.vue";

describe("GrimicornWindowTitlebar", () => {
  it("renders correctly", () => {
    const wrapper = mount(GrimicornWindowTitlebar, {
      slots: { default: '<span class="gc-chrome-label">notes.md</span>' },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders three traffic-light dots before the slot content", () => {
    const wrapper = mount(GrimicornWindowTitlebar, {
      slots: { default: "<em>label</em>" },
    });
    const children = Array.from(wrapper.element.children);

    expect(wrapper.findAll(".gc-dot")).toHaveLength(3);
    expect(children[3]?.tagName).toBe("EM");
  });
});
