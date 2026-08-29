import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockNavItems } from "../__fixtures__/mockData";

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

import AppNav from "@components/AppNav.vue";
import AppSocialLinks from "@components/AppSocialLinks.vue";

describe("AppNav", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(AppNav);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("hides the social links below the md breakpoint", () => {
    const wrapper = shallowMount(AppNav);
    expect(wrapper.findComponent(AppSocialLinks).props("hideOnMobile")).toBe(
      true,
    );
  });
});
