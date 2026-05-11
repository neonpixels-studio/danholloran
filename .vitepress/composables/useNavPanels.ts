import { ref, computed } from "vue";

type Panel = "search" | "mobile-menu";

const activePanel = ref<Panel | null>(null);

export function useNavPanels() {
  const isSearchOpen = computed(() => activePanel.value === "search");
  const isMobileMenuOpen = computed(() => activePanel.value === "mobile-menu");

  function openSearch() {
    activePanel.value = "search";
  }

  function openMobileMenu() {
    activePanel.value = "mobile-menu";
  }

  function closeAll() {
    activePanel.value = null;
  }

  function toggleSearch() {
    activePanel.value = activePanel.value === "search" ? null : "search";
  }

  function toggleMobileMenu() {
    activePanel.value =
      activePanel.value === "mobile-menu" ? null : "mobile-menu";
  }

  return {
    isSearchOpen,
    isMobileMenuOpen,
    openSearch,
    openMobileMenu,
    closeAll,
    toggleSearch,
    toggleMobileMenu,
  };
}
