import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockNavItems, mockSocialLinks } from "../__fixtures__/mockData";

vi.mock("vitepress", () => ({
  useRouter: () => ({ go: vi.fn() }),
}));

vi.mock("@composables/useMainNav.ts", async () => {
  const { computed } = await import("vue");
  return {
    useMainNav: () => ({
      navItems: computed(() => mockNavItems),
    }),
  };
});

vi.mock("@composables/useNavPanels.ts", async () => {
  const { computed } = await import("vue");
  return {
    useNavPanels: () => ({
      isMobileMenuOpen: computed(() => true),
      closeAll: vi.fn(),
    }),
  };
});

vi.mock("@data/socialLinks", () => ({ default: mockSocialLinks }));

import AppMobileMenu from "@components/AppMobileMenu.vue";

describe("AppMobileMenu", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(AppMobileMenu, {
      global: { stubs: { Teleport: true } },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
