import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import GrimicornWindowTitlebar from "@components/GrimicornWindowTitlebar.vue";

const DOT_COUNT = 3;

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
    const children = Array.from((wrapper.element as HTMLElement).children);

    const dots = children.slice(0, DOT_COUNT);

    expect(wrapper.findAll(".gc-dot")).toHaveLength(DOT_COUNT);
    expect(dots.every((child) => child.classList.contains("gc-dot"))).toBe(
      true,
    );
    expect(children[DOT_COUNT]?.tagName).toBe("EM");
  });
});
