import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockSearchItems } from "../__fixtures__/mockData";

vi.mock("vitepress", () => ({
  useRouter: () => ({ go: vi.fn() }),
}));

vi.mock("@composables/useNavPanels.ts", async () => {
  const { computed } = await import("vue");
  return {
    useNavPanels: () => ({
      isSearchOpen: computed(() => true),
      openSearch: vi.fn(),
      closeAll: vi.fn(),
    }),
  };
});

vi.mock("@content/posts/search.data.ts", () => ({
  data: mockSearchItems,
}));

import AppSearch from "@components/AppSearch.vue";

describe("AppSearch", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(AppSearch, {
      global: { stubs: { Teleport: true } },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
