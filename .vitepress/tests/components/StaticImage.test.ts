import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StaticImage from "@components/StaticImage.vue";

describe("StaticImage", () => {
  it("serves avif then webp sources with the original as the <img> fallback", () => {
    const wrapper = mount(StaticImage, {
      props: { src: "/images/profile.png" },
    });

    const sources = wrapper.findAll("source");
    expect(sources.map((source) => source.attributes("type"))).toEqual([
      "image/avif",
      "image/webp",
    ]);
    expect(sources.map((source) => source.attributes("srcset"))).toEqual([
      "/images/profile.avif",
      "/images/profile.webp",
    ]);
    expect(wrapper.find("img").attributes("src")).toBe("/images/profile.png");
  });

  it("forwards attrs to the <img>, not the <picture>", () => {
    const wrapper = mount(StaticImage, {
      props: { src: "/images/profile.png" },
      attrs: { alt: "Dan Holloran", class: "h-full", width: "40" },
    });

    const img = wrapper.find("img");
    expect(wrapper.find("picture").classes()).not.toContain("h-full");
    expect(img.classes()).toContain("h-full");
    expect(img.attributes("alt")).toBe("Dan Holloran");
    expect(img.attributes("width")).toBe("40");
  });

  it("renders a plain <img> for formats with no generated copies", () => {
    const wrapper = mount(StaticImage, {
      props: { src: "/images/logo.svg" },
    });

    expect(wrapper.find("picture").exists()).toBe(false);
    expect(wrapper.find("img").attributes("src")).toBe("/images/logo.svg");
  });
});
