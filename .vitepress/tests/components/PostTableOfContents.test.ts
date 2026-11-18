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
    const nav = wrapper.find("nav");
    const labelId = nav.attributes("aria-labelledby");
    expect(nav.attributes("aria-label")).toBeUndefined();
    expect(labelId).toBeTruthy();
    expect(wrapper.find(`[id="${labelId}"]`).text()).toBe("On this page");
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

  it("gives each instance on a page a unique label id", () => {
    const props = { headers: sections(TOC_MIN_SECTIONS) };
    const wrapper = mount({
      components: { PostTableOfContents },
      setup: () => ({ props }),
      template:
        "<div><PostTableOfContents v-bind='props' /><PostTableOfContents v-bind='props' /></div>",
    });
    const navs = wrapper.findAll("nav");
    expect(navs).toHaveLength(2);
    const labelIds = navs.map((nav) => nav.attributes("aria-labelledby"));
    navs.forEach((nav, index) => {
      expect(nav.find(`[id="${labelIds[index]}"]`).text()).toBe("On this page");
    });
    expect(labelIds[0]).not.toBe(labelIds[1]);
  });
});
