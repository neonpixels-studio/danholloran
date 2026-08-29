import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { mockSocialLinks } from "../__fixtures__/mockData";

vi.mock("@data/socialLinks", () => ({ default: mockSocialLinks }));

import AppSocialLinks from "@components/AppSocialLinks.vue";

const expectedLinkCount = Object.keys(mockSocialLinks).length;

describe("AppSocialLinks", () => {
  it("renders the social links list", () => {
    const wrapper = mount(AppSocialLinks);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders a link for every platform in the real data module", async () => {
    const actual = await vi.importActual<{ default: Record<string, string> }>(
      "@data/socialLinks",
    );
    const wrapper = mount(AppSocialLinks);

    expect(wrapper.findAll("li a")).toHaveLength(
      Object.keys(actual.default).length,
    );
  });

  it("renders each platform's label bound to its href", () => {
    const expectedLinks = [
      ["GitHub", mockSocialLinks.GITHUB],
      ["Instagram", mockSocialLinks.INSTAGRAM],
      ["LinkedIn", mockSocialLinks.LINKEDIN],
      ["X", mockSocialLinks.X],
      ["Bluesky", mockSocialLinks.BLUE_SKY],
    ];
    const wrapper = mount(AppSocialLinks);

    const renderedLinks = wrapper
      .findAll("li a")
      .map((link) => [link.attributes("aria-label"), link.attributes("href")]);

    expect(renderedLinks).toEqual(expectedLinks);
  });

  it("opens each link safely in a new tab with an icon", () => {
    const wrapper = mount(AppSocialLinks);

    const links = wrapper.findAll("li a");
    expect(links).toHaveLength(expectedLinkCount);
    links.forEach((link) => {
      expect(link.attributes("target")).toBe("_blank");
      expect(link.attributes("rel")).toBe("noopener");
      expect(link.attributes("aria-label")).toBeTruthy();
      expect(link.find("svg").exists()).toBe(true);
    });
  });

  it("keeps links visible on mobile by default", () => {
    const wrapper = mount(AppSocialLinks);

    const links = wrapper.findAll("li a");
    expect(links).toHaveLength(expectedLinkCount);
    links.forEach((link) => {
      expect(link.classes()).not.toContain("max-md:hidden");
    });
  });

  it("hides links below the md breakpoint when hideOnMobile is set", () => {
    const wrapper = mount(AppSocialLinks, { props: { hideOnMobile: true } });

    const links = wrapper.findAll("li a");
    expect(links).toHaveLength(expectedLinkCount);
    links.forEach((link) => {
      expect(link.classes()).toContain("max-md:hidden");
    });
  });
});
