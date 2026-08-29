import { describe, it, expect, vi, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { ref } from "vue";

vi.setSystemTime(new Date("2026-06-12"));

vi.mock("vitepress", () => ({
  useData: () => ({ isDark: ref(false) }),
}));

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

global.fetch = vi.fn().mockResolvedValue({
  headers: { get: () => "Sat, 01 Jan 2025 00:00:00 GMT" },
  ok: true,
});

import HomeTravelMap from "@components/HomeTravelMap.vue";

describe("HomeTravelMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      headers: { get: () => "Sat, 01 Jan 2025 00:00:00 GMT" },
      ok: true,
    });
  });

  it("renders correctly", () => {
    const wrapper = shallowMount(HomeTravelMap);
    expect(wrapper.html()).toMatchSnapshot();
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
