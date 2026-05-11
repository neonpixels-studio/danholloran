import { describe, it, expect, beforeEach } from "vitest";
import { useNavPanels } from "../../composables/useNavPanels";

describe("useNavPanels", () => {
  let nav: ReturnType<typeof useNavPanels>;

  beforeEach(() => {
    nav = useNavPanels();
    nav.closeAll();
  });

  it("starts with all panels closed", () => {
    expect(nav.isSearchOpen.value).toBe(false);
    expect(nav.isMobileMenuOpen.value).toBe(false);
  });

  it("openSearch opens search and leaves mobile menu closed", () => {
    nav.openSearch();
    expect(nav.isSearchOpen.value).toBe(true);
    expect(nav.isMobileMenuOpen.value).toBe(false);
  });

  it("openMobileMenu opens mobile menu and leaves search closed", () => {
    nav.openMobileMenu();
    expect(nav.isMobileMenuOpen.value).toBe(true);
    expect(nav.isSearchOpen.value).toBe(false);
  });

  it("opening search while mobile menu is open closes the mobile menu", () => {
    nav.openMobileMenu();
    nav.openSearch();
    expect(nav.isSearchOpen.value).toBe(true);
    expect(nav.isMobileMenuOpen.value).toBe(false);
  });

  it("opening mobile menu while search is open closes search", () => {
    nav.openSearch();
    nav.openMobileMenu();
    expect(nav.isSearchOpen.value).toBe(false);
    expect(nav.isMobileMenuOpen.value).toBe(true);
  });

  it("closeAll closes an open panel", () => {
    nav.openSearch();
    nav.closeAll();
    expect(nav.isSearchOpen.value).toBe(false);
    expect(nav.isMobileMenuOpen.value).toBe(false);
  });

  it("toggleSearch opens search when closed", () => {
    nav.toggleSearch();
    expect(nav.isSearchOpen.value).toBe(true);
  });

  it("toggleSearch closes search when open", () => {
    nav.openSearch();
    nav.toggleSearch();
    expect(nav.isSearchOpen.value).toBe(false);
  });

  it("toggleMobileMenu opens mobile menu when closed", () => {
    nav.toggleMobileMenu();
    expect(nav.isMobileMenuOpen.value).toBe(true);
  });

  it("toggleMobileMenu closes mobile menu when open", () => {
    nav.openMobileMenu();
    nav.toggleMobileMenu();
    expect(nav.isMobileMenuOpen.value).toBe(false);
  });

  it("toggleSearch while mobile menu open closes mobile menu and opens search", () => {
    nav.openMobileMenu();
    nav.toggleSearch();
    expect(nav.isMobileMenuOpen.value).toBe(false);
    expect(nav.isSearchOpen.value).toBe(true);
  });

  it("toggleMobileMenu while search open closes search and opens mobile menu", () => {
    nav.openSearch();
    nav.toggleMobileMenu();
    expect(nav.isSearchOpen.value).toBe(false);
    expect(nav.isMobileMenuOpen.value).toBe(true);
  });
});
