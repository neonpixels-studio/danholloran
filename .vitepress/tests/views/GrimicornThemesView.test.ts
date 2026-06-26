import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, shallowMount, flushPromises } from "@vue/test-utils";

vi.mock("@composables/useRevealAnimations", () => ({
  useRevealAnimations: vi.fn(),
}));

import GrimicornThemesView from "@views/GrimicornThemesView.vue";
import GrimicornPreviewToggle from "@components/GrimicornPreviewToggle.vue";

describe("GrimicornThemesView", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders correctly", () => {
    const wrapper = shallowMount(GrimicornThemesView);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("defaults to the dark preview and shows the dark hex values", () => {
    const wrapper = mount(GrimicornThemesView);

    expect(wrapper.find(".gc-scope").attributes("data-gc")).toBe("dark");
    expect(wrapper.text()).toContain("#83AFE5");
  });

  it("re-themes every preview and swaps to light hexes when toggled", async () => {
    const wrapper = mount(GrimicornThemesView);

    await wrapper
      .findComponent(GrimicornPreviewToggle)
      .vm.$emit("update:modelValue", "light");

    expect(wrapper.find(".gc-scope").attributes("data-gc")).toBe("light");
    expect(wrapper.text()).toContain("#4A80C8");
  });

  it("flashes 'copied!' when a swatch is clicked", async () => {
    const wrapper = mount(GrimicornThemesView);

    await wrapper.find(".gc-swatch").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("copied!");
  });

  it("links 'download all' to the prebuilt zip bundle", () => {
    const wrapper = mount(GrimicornThemesView);

    const zipLink = wrapper
      .findAll("a")
      .find((link) => link.text().includes("download all"));

    expect(zipLink?.attributes("href")).toBe(
      "/grimicorn-themes/grimicorn-themes.zip",
    );
  });
});
