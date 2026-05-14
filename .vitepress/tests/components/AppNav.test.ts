import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockNavItems, mockSocialLinks } from "../__fixtures__/mockData";

vi.mock("vitepress", () => ({
  useRouter: () => ({ go: vi.fn() }),
  useRoute: () => ({ path: "/" }),
}));

vi.mock("@composables/useMainNav.ts", async () => {
  const { ref, computed } = await import("vue");
  const activeSection = ref("");
  return {
    useMainNav: () => ({
      navItems: computed(() => mockNavItems),
      isPathActive: () => false,
      activeSection,
    }),
  };
});

vi.mock("@composables/useNavPanels.ts", async () => {
  const { computed } = await import("vue");
  return {
    useNavPanels: () => ({
      isMobileMenuOpen: computed(() => false),
      toggleMobileMenu: vi.fn(),
    }),
  };
});

vi.mock("@data/socialLinks", () => ({ default: mockSocialLinks }));

import AppNav from "@components/AppNav.vue";

describe("AppNav", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(AppNav);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
