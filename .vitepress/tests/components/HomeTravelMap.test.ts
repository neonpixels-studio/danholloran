import { describe, it, expect, vi, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { ref } from "vue";

vi.setSystemTime(new Date("2026-06-12"));

vi.mock("vitepress", () => ({
  useData: () => ({ isDark: ref(false) }),
}));

vi.mock("@content/posts/posts.data.ts", () => ({
  data: [
    { frontmatter: { tags: ["national-park", "travel"] } },
    { frontmatter: { tags: ["national-park", "travel"] } },
    { frontmatter: { tags: ["travel"] } },
    // Published posts with an absent and a null tags value — neither must crash
    // the national-park counter.
    { frontmatter: {} },
    { frontmatter: { tags: null } },
    // A scalar (non-array) tag is intentionally not counted here, matching the
    // sibling list consumers PostsView.tagsOf and archivePaths, which also treat
    // a non-array `tags` as empty. So this does not add to the count.
    { frontmatter: { tags: "national-park" } },
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

  it("counts only tagged posts when others are missing tags", () => {
    const wrapper = shallowMount(HomeTravelMap);
    const nationalParkStat = wrapper
      .findAll(".border-t-2")
      .find((stat) => stat.text().includes("national parks"));
    expect(nationalParkStat).toBeDefined();
    // Two mocked posts carry the national-park tag; the tagless, null-tag, and
    // scalar-tag posts must be skipped rather than throwing a TypeError.
    expect(nationalParkStat?.text()).toMatch(/^2\+/);
  });
});
