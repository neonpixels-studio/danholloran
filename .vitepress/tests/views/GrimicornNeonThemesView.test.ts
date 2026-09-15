import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, shallowMount, flushPromises } from "@vue/test-utils";
import { mockGtag, clearGtag } from "../helpers/gtag";

vi.mock("@composables/useRevealAnimations", () => ({
  useRevealAnimations: vi.fn(),
}));

import GrimicornNeonThemesView from "@views/GrimicornNeonThemesView.vue";

describe("GrimicornNeonThemesView", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearGtag();
  });
  it("renders correctly", () => {
    const wrapper = shallowMount(GrimicornNeonThemesView);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("shows the neon blue hex and is always dark", () => {
    const wrapper = mount(GrimicornNeonThemesView);
    expect(wrapper.text()).toContain("#2323FF");
  });

  it("links 'download all' to the prebuilt neon zip bundle", () => {
    const wrapper = mount(GrimicornNeonThemesView);

    const zipLink = wrapper
      .findAll("a")
      .find((link) => link.text().includes("download all"));

    expect(zipLink?.attributes("href")).toBe(
      "/grimicorn-neon-themes/grimicorn-neon-themes.zip",
    );
  });

  it("flashes 'copied!' when a swatch is clicked", async () => {
    const wrapper = mount(GrimicornNeonThemesView);

    await wrapper.find(".n-swatch").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("copied!");
  });

  it("orders tool cards with featured ports before non-featured ones", () => {
    const wrapper = mount(GrimicornNeonThemesView);

    const cards = wrapper.findAll(".n-card");
    const featuredFlags = cards.map((card) => card.find(".n-badge").exists());
    const featuredCount = featuredFlags.filter(Boolean).length;

    expect(featuredFlags.slice(0, featuredCount).every(Boolean)).toBe(true);
    expect(featuredFlags.slice(featuredCount).some(Boolean)).toBe(false);
  });

  it("tracks a tool download scoped to the grimicorn-neon theme", async () => {
    const gtag = mockGtag();
    const wrapper = mount(GrimicornNeonThemesView);

    await wrapper.find(".n-card a[download]").trigger("click");

    expect(gtag).toHaveBeenCalledWith(
      "event",
      "theme_download",
      expect.objectContaining({ theme: "grimicorn-neon", format: "tool" }),
    );
  });
});
