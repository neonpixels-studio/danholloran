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
    it("returns 6 nav items", () => {
      const { navItems } = useMainNav();
      expect(navItems.value).toHaveLength(6);
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
        "Themes",
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
        "/themes/grimicorn",
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

    it("Themes isActive when path is /themes/grimicorn (prefix match)", () => {
      routeState.path = "/themes/grimicorn";
      const { navItems } = useMainNav();
      expect(navItems.value[5].isActive()).toBe(true);
    });

    it("Themes has Grimicorn and Grimicorn Neon children", () => {
      const { navItems } = useMainNav();
      const children = navItems.value[5].children;
      expect(children?.map((child) => child.link)).toEqual([
        "/themes/grimicorn",
        "/themes/grimicorn-neon",
      ]);
    });

    it("only the Neon child is active on /themes/grimicorn-neon", () => {
      routeState.path = "/themes/grimicorn-neon";
      const { navItems } = useMainNav();
      const [grimicorn, neon] = navItems.value[5].children ?? [];
      expect(grimicorn.isActive()).toBe(false);
      expect(neon.isActive()).toBe(true);
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
