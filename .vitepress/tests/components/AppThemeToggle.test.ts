import { describe, it, expect, vi, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";

const { mockCycleTheme, mockThemeState } = vi.hoisted(() => ({
  mockCycleTheme: vi.fn(),
  mockThemeState: { theme: "auto" as "auto" | "light" | "dark" },
}));

vi.mock("@composables/useAppearance.ts", async () => {
  const { ref, computed } = await import("vue");
  return {
    useAppearance: () => {
      const theme = ref(mockThemeState.theme);
      const themeIcon = computed(() => {
        if (theme.value === "dark") return "moon";
        if (theme.value === "light") return "sun";
        return "monitor";
      });
      return { theme, themeIcon, cycleTheme: mockCycleTheme };
    },
  };
});

import AppThemeToggle from "@components/AppThemeToggle.vue";

beforeEach(() => {
  vi.clearAllMocks();
  mockThemeState.theme = "auto";
});

describe("AppThemeToggle", () => {
  it("renders the monitor icon when theme is auto (system)", () => {
    const wrapper = shallowMount(AppThemeToggle);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders the sun icon when theme is light", () => {
    mockThemeState.theme = "light";
    const wrapper = shallowMount(AppThemeToggle);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders the moon icon when theme is dark", () => {
    mockThemeState.theme = "dark";
    const wrapper = shallowMount(AppThemeToggle);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("calls cycleTheme when clicked", async () => {
    const wrapper = shallowMount(AppThemeToggle);
    await wrapper.find("button").trigger("click");
    expect(mockCycleTheme).toHaveBeenCalledOnce();
  });
});
