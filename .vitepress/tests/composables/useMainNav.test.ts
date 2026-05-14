import { describe, it, expect, vi, beforeEach } from "vitest";

const routeState = { path: "/" };

vi.mock("vitepress", () => ({
  useRoute: () => routeState,
}));

import { useMainNav } from "../../theme/composables/useMainNav";

describe("useMainNav", () => {
  beforeEach(() => {
    routeState.path = "/";
  });

  describe("isPathActive", () => {
    it("returns true for exact path match", () => {
      routeState.path = "/resume";
      const { isPathActive } = useMainNav();
      expect(isPathActive("/resume")).toBe(true);
    });

    it("returns false for non-matching path", () => {
      routeState.path = "/resume";
      const { isPathActive } = useMainNav();
      expect(isPathActive("/posts")).toBe(false);
    });

    it("ignores trailing slash on route path", () => {
      routeState.path = "/resume/";
      const { isPathActive } = useMainNav();
      expect(isPathActive("/resume")).toBe(true);
    });

    it("ignores trailing slash on argument path", () => {
      routeState.path = "/resume";
      const { isPathActive } = useMainNav();
      expect(isPathActive("/resume/")).toBe(true);
    });

    it("returns true for prefix match when startsWith is true", () => {
      routeState.path = "/posts/my-post";
      const { isPathActive } = useMainNav();
      expect(isPathActive("/posts", true)).toBe(true);
    });

    it("returns false when not matching prefix with startsWith true", () => {
      routeState.path = "/resume";
      const { isPathActive } = useMainNav();
      expect(isPathActive("/posts", true)).toBe(false);
    });
  });

  describe("isSectionActive", () => {
    it("returns true on home page when activeSection matches", () => {
      routeState.path = "/";
      const { isSectionActive, activeSection } = useMainNav();
      activeSection.value = "about";
      expect(isSectionActive("about")).toBe(true);
    });

    it("returns false on home page when activeSection does not match", () => {
      routeState.path = "/";
      const { isSectionActive, activeSection } = useMainNav();
      activeSection.value = "about";
      expect(isSectionActive("projects")).toBe(false);
    });

    it("returns false on non-home path even if section matches", () => {
      routeState.path = "/resume";
      const { isSectionActive, activeSection } = useMainNav();
      activeSection.value = "about";
      expect(isSectionActive("about")).toBe(false);
    });
  });

  describe("navItems", () => {
    it("returns 5 nav items", () => {
      const { navItems } = useMainNav();
      expect(navItems.value).toHaveLength(5);
    });

    it("has correct labels", () => {
      const { navItems } = useMainNav();
      const labels = navItems.value.map((item) => item.label);
      expect(labels).toEqual([
        "About",
        "Projects",
        "Experience",
        "Resume",
        "Blog",
      ]);
    });

    it("has correct links", () => {
      const { navItems } = useMainNav();
      const links = navItems.value.map((item) => item.link);
      expect(links).toEqual([
        "/#about",
        "/#projects",
        "/#experience",
        "/resume",
        "/posts",
      ]);
    });

    it("Resume isActive when path is /resume", () => {
      routeState.path = "/resume";
      const { navItems } = useMainNav();
      expect(navItems.value[3].isActive()).toBe(true);
    });

    it("Blog isActive when path is /posts/my-post (prefix match)", () => {
      routeState.path = "/posts/my-post";
      const { navItems } = useMainNav();
      expect(navItems.value[4].isActive()).toBe(true);
    });

    it("About isActive when on home with activeSection set to 'about'", () => {
      routeState.path = "/";
      const { navItems, activeSection } = useMainNav();
      activeSection.value = "about";
      expect(navItems.value[0].isActive()).toBe(true);
    });

    it("no item is active when on an unrelated path", () => {
      routeState.path = "/404";
      const { navItems } = useMainNav();
      expect(navItems.value.every((item) => !item.isActive())).toBe(true);
    });
  });

  describe("activeSection", () => {
    it("starts as empty string", () => {
      const { activeSection } = useMainNav();
      expect(activeSection.value).toBe("");
    });

    it("can be mutated", () => {
      const { activeSection } = useMainNav();
      activeSection.value = "projects";
      expect(activeSection.value).toBe("projects");
    });
  });
});
