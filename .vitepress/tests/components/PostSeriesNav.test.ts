import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PostSeriesNav from "@components/PostSeriesNav.vue";
import type { PostSeries } from "@typedefs";

const series: PostSeries = {
  name: "Lessons from an agent fleet",
  part: 2,
  total: 3,
  parts: [
    { title: "Intro", url: "/posts/intro" },
    { title: "Tests pass is a claim", url: "/posts/tests-pass" },
    { title: "Flake or failure", url: "/posts/flake-or-failure" },
  ],
};

describe("PostSeriesNav", () => {
  it("labels the nav with the post's place in the series", () => {
    const wrapper = mount(PostSeriesNav, { props: { series } });
    const labelId = wrapper.attributes("aria-labelledby");

    expect(wrapper.find(`#${labelId}`).text()).toBe(
      "Part 2 of 3 · Lessons from an agent fleet",
    );
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("links every other part and marks the current one", () => {
    const wrapper = mount(PostSeriesNav, { props: { series } });
    const links = wrapper.findAll("a");

    expect(links.map((link) => link.attributes("href"))).toEqual([
      "/posts/intro",
      "/posts/flake-or-failure",
    ]);
    expect(wrapper.find("[aria-current='page']").text()).toBe(
      "Tests pass is a claim",
    );
  });

  it("renders nothing outside a series", () => {
    expect(mount(PostSeriesNav).find("nav").exists()).toBe(false);
    expect(
      mount(PostSeriesNav, { props: { series: null } })
        .find("nav")
        .exists(),
    ).toBe(false);
  });
});
