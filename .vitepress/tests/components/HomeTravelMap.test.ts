import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";

vi.setSystemTime(new Date("2026-06-12"));

// `posts.data` is transformPosts' output, which normalizes `tags` to an array
// at the chokepoint — so every entry here is already an array. Authored posts
// with an absent, null, or scalar `tags` arrive as `[]`; that upstream coercion
// is covered by transformPosts.test.ts and normalizeTags.test.ts, so this file
// only needs one post that is post-normalization empty to prove the counter
// skips a non-national-park post.
vi.mock("@content/posts/posts.data.ts", () => ({
  data: [
    { frontmatter: { tags: ["national-park", "travel"] } },
    { frontmatter: { tags: ["national-park", "travel"] } },
    { frontmatter: { tags: ["travel"] } },
    { frontmatter: { tags: [] } },
  ],
}));

// mapUpdated.data.ts is a build-time (Node-only) data loader — its `data`
// export only exists once vitepress's own vite plugin processes the file, so
// tests mock it directly rather than exercising the real loader (same
// convention as posts.data.ts above). Null/formatting edge cases for the
// dates themselves are covered by formatDate.test.ts's formatMapUpdatedDate
// suite; this file only needs to prove the component renders both the light
// and dark variant (CSS, not JS, picks which one is visible — see the
// component's comment on why this can't switch on `isDark` in script).
vi.mock("@data/mapUpdated.data.ts", () => ({
  data: {
    light: "2025-01-01T00:00:00.000Z",
    dark: "2025-06-15T00:00:00.000Z",
  },
}));

import HomeTravelMap from "@components/HomeTravelMap.vue";

describe("HomeTravelMap", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(HomeTravelMap);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders the light map's git-derived date for CSS to show in light mode", () => {
    const wrapper = shallowMount(HomeTravelMap);
    expect(wrapper.find(".map-date-light").text()).toBe("updated Jan 1, 2025");
  });

  it("renders the dark map's git-derived date for CSS to show in dark mode", () => {
    const wrapper = shallowMount(HomeTravelMap);
    expect(wrapper.find(".map-date-dark").text()).toBe("updated Jun 15, 2025");
  });

  it("counts only posts carrying the national-park tag", () => {
    const wrapper = shallowMount(HomeTravelMap);
    const nationalParkStat = wrapper
      .findAll(".border-t-2")
      .find((stat) => stat.text().includes("national parks"));
    expect(nationalParkStat).toBeDefined();
    // Two mocked posts carry the national-park tag; the travel-only and
    // empty-tag posts are skipped.
    expect(nationalParkStat?.text()).toMatch(/^2\+/);
  });
});
