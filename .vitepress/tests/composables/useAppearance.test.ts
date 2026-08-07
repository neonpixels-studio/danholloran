import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineComponent } from "vue";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";

import {
  readStored,
  useAppearance,
} from "../../theme/composables/useAppearance";

const STORAGE_KEY = "vitepress-theme-appearance";

const mountedWrappers: VueWrapper[] = [];
const mediaQueryListeners = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

function mockPrefersDark(prefersDark: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: mediaQueryListeners.addEventListener,
    removeEventListener: mediaQueryListeners.removeEventListener,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList);
}

type Appearance = ReturnType<typeof useAppearance>;

function mountAppearance() {
  let appearance: Appearance;
  const Harness = defineComponent({
    setup() {
      appearance = useAppearance();
      return () => null;
    },
  });
  const wrapper = mount(Harness, { attachTo: document.body });
  mountedWrappers.push(wrapper);
  return { wrapper, appearance: appearance! };
}

describe("useAppearance", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    mediaQueryListeners.addEventListener.mockClear();
    mediaQueryListeners.removeEventListener.mockClear();
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.restoreAllMocks();
  });

  describe("readStored", () => {
    it("returns a valid stored theme unchanged", () => {
      localStorage.setItem(STORAGE_KEY, "dark");
      expect(readStored()).toBe("dark");
    });

    it("returns 'light' when a valid 'light' value is stored", () => {
      localStorage.setItem(STORAGE_KEY, "light");
      expect(readStored()).toBe("light");
    });

    it("falls back to the default theme when no value is stored", () => {
      expect(readStored()).toBe("auto");
    });

    it("falls back to the default theme when the stored value is corrupt", () => {
      localStorage.setItem(STORAGE_KEY, "not-a-theme");
      expect(readStored()).toBe("auto");
    });

    it("falls back to the default theme when the stored value is empty", () => {
      localStorage.setItem(STORAGE_KEY, "");
      expect(readStored()).toBe("auto");
    });

    it("falls back to the default theme when localStorage access throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      expect(readStored()).toBe("auto");
    });
  });

  describe("applied theme on mount", () => {
    it("resolves a corrupt stored value to the default (auto) rather than propagating it", async () => {
      localStorage.setItem(STORAGE_KEY, "not-a-theme");
      mockPrefersDark(true);
      mountAppearance();
      await flushPromises();
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("applies the stored dark theme on mount", async () => {
      localStorage.setItem(STORAGE_KEY, "dark");
      mockPrefersDark(false);
      mountAppearance();
      await flushPromises();
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("cycleTheme", () => {
    it("persists and applies the next theme in the cycle", async () => {
      localStorage.setItem(STORAGE_KEY, "auto");
      mockPrefersDark(false);
      const { appearance } = mountAppearance();
      await flushPromises();

      appearance.cycleTheme();

      expect(appearance.theme.value).toBe("light");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    });

    it("wraps from the last theme back to the first", async () => {
      localStorage.setItem(STORAGE_KEY, "dark");
      mockPrefersDark(false);
      const { appearance } = mountAppearance();
      await flushPromises();

      appearance.cycleTheme();

      expect(appearance.theme.value).toBe("auto");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("auto");
    });

    it("keeps the applied theme when persistence throws", async () => {
      localStorage.setItem(STORAGE_KEY, "light");
      mockPrefersDark(false);
      const { appearance } = mountAppearance();
      await flushPromises();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => appearance.cycleTheme()).not.toThrow();
      expect(appearance.theme.value).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("removes the same system-preference listener it registered on unmount", async () => {
      mockPrefersDark(false);
      const { wrapper } = mountAppearance();
      await flushPromises();
      expect(mediaQueryListeners.addEventListener).toHaveBeenCalledTimes(1);
      const [registeredEvent, registeredHandler] =
        mediaQueryListeners.addEventListener.mock.calls[0];

      mountedWrappers.splice(mountedWrappers.indexOf(wrapper), 1);
      wrapper.unmount();

      expect(mediaQueryListeners.removeEventListener).toHaveBeenCalledTimes(1);
      expect(mediaQueryListeners.removeEventListener).toHaveBeenCalledWith(
        registeredEvent,
        registeredHandler,
      );
    });
  });
});
