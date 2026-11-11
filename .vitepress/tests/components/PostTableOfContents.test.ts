import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PostTableOfContents from "@components/PostTableOfContents.vue";
import { TOC_MIN_SECTIONS, type PostHeader } from "@utils/postHeaders";

function sections(count: number): PostHeader[] {
  return Array.from({ length: count }, (_, index) => ({
    level: 2,
    title: `Section ${index + 1}`,
    link: `#section-${index + 1}`,
  }));
}

describe("PostTableOfContents", () => {
  it("renders a labelled nav of anchor links at the threshold", () => {
    const wrapper = mount(PostTableOfContents, {
      props: { headers: sections(TOC_MIN_SECTIONS) },
    });
    expect(wrapper.find("nav").attributes("aria-label")).toBe(
      "Table of contents",
    );
    const links = wrapper.findAll("ul > li > a");
    expect(links).toHaveLength(TOC_MIN_SECTIONS);
    expect(links[0].attributes("href")).toBe("#section-1");
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders nothing below the threshold", () => {
    const wrapper = mount(PostTableOfContents, {
      props: { headers: sections(TOC_MIN_SECTIONS - 1) },
    });
    expect(wrapper.find("nav").exists()).toBe(false);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("lists only h2s when h3s are present", () => {
    const wrapper = mount(PostTableOfContents, {
      props: {
        headers: [
          ...sections(TOC_MIN_SECTIONS),
          { level: 3, title: "Nested", link: "#nested" },
        ],
      },
    });
    expect(wrapper.text()).not.toContain("Nested");
    expect(wrapper.findAll("li")).toHaveLength(TOC_MIN_SECTIONS);
  });
});
