import { describe, it, expect, vi, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { ref } from "vue";

vi.mock("vitepress", () => ({
  useData: () => ({ isDark: ref(false) }),
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
});
