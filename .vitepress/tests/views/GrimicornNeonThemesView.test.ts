import { describe, it, expect, vi } from "vitest";
import { mount, shallowMount, flushPromises } from "@vue/test-utils";

vi.mock("@composables/useRevealAnimations", () => ({
  useRevealAnimations: vi.fn(),
}));

import GrimicornNeonThemesView from "@views/GrimicornNeonThemesView.vue";

describe("GrimicornNeonThemesView", () => {
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
});
