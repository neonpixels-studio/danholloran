import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";

vi.setSystemTime(new Date("2026-06-12"));

// mapUpdated.data.ts is a build-time (Node-only) data loader — its `data`
// export only exists once vitepress's own vite plugin processes the file, so
// tests mock it directly rather than exercising the real loader (same
// convention as the other data loaders). Null/formatting edge cases for the
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

// The tag counting itself lives in buildHomePosts (see postViews.test.ts).
const NATIONAL_PARK_COUNT = 26;

function mountMap() {
  return shallowMount(HomeTravelMap, {
    props: { nationalParkCount: NATIONAL_PARK_COUNT },
  });
}

describe("HomeTravelMap", () => {
  it("renders correctly", () => {
    const wrapper = mountMap();
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders the light map's git-derived date for CSS to show in light mode", () => {
    const wrapper = mountMap();
    expect(wrapper.find(".map-date-light").text()).toBe("updated Jan 1, 2025");
  });

  it("renders the dark map's git-derived date for CSS to show in dark mode", () => {
    const wrapper = mountMap();
    expect(wrapper.find(".map-date-dark").text()).toBe("updated Jun 15, 2025");
  });

  it("renders the national park count it is given", () => {
    const wrapper = mountMap();
    const nationalParkStat = wrapper
      .findAll(".border-t-2")
      .find((stat) => stat.text().includes("national parks"));
    expect(nationalParkStat).toBeDefined();
    expect(nationalParkStat?.text()).toMatch(/^26\+/);
  });
});
