import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, shallowMount, flushPromises } from "@vue/test-utils";
import { mockGtag, clearGtag } from "../helpers/gtag";

vi.mock("@composables/useRevealAnimations", () => ({
  useRevealAnimations: vi.fn(),
}));

import GrimicornThemesView from "@views/GrimicornThemesView.vue";
import GrimicornPreviewToggle from "@components/GrimicornPreviewToggle.vue";

describe("GrimicornThemesView", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearGtag();
  });

  it("renders correctly", () => {
    const wrapper = shallowMount(GrimicornThemesView);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("defaults to the dark preview and shows the dark hex values", () => {
    const wrapper = mount(GrimicornThemesView);

    expect(wrapper.find(".gc-scope").attributes("data-gc")).toBe("dark");
    expect(wrapper.text()).toContain("#99BDEA");
  });

  it("re-themes every preview and swaps to light hexes when toggled", async () => {
    const wrapper = mount(GrimicornThemesView);

    await wrapper
      .findComponent(GrimicornPreviewToggle)
      .vm.$emit("update:modelValue", "light");

    expect(wrapper.find(".gc-scope").attributes("data-gc")).toBe("light");
    expect(wrapper.text()).toContain("#4475B7");
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

  it("orders tool cards with featured ports before non-featured ones", () => {
    const wrapper = mount(GrimicornThemesView);

    const cards = wrapper.findAll(".group.flex.flex-col.border-t-2");
    const featuredFlags = cards.map((card) =>
      card.find(".bg-accent-dim").exists(),
    );
    const featuredCount = featuredFlags.filter(Boolean).length;

    expect(featuredFlags.slice(0, featuredCount).every(Boolean)).toBe(true);
    expect(featuredFlags.slice(featuredCount).some(Boolean)).toBe(false);
  });

  it("tracks a tool download scoped to the grimicorn theme", async () => {
    const gtag = mockGtag();
    const wrapper = mount(GrimicornThemesView);

    await wrapper
      .find(".group.flex.flex-col.border-t-2 a[download]")
      .trigger("click");

    expect(gtag).toHaveBeenCalledWith(
      "event",
      "theme_download",
      expect.objectContaining({ theme: "grimicorn", format: "tool" }),
    );
  });
});
