import { NavItem } from "@typedef";
import { useRoute } from "vitepress";
import { computed, ref } from "vue";

export function useMainNav() {
  const route = useRoute();
  const activeSection = ref("");
  function cleanPath(path: string) {
    return path.replace(/\/$/g, "");
  }

  function isPathActive(path: string, startsWith = false) {
    if (startsWith) {
      return cleanPath(route.path).startsWith(cleanPath(path));
    }

    return cleanPath(route.path) === cleanPath(path);
  }

  function isSectionActive(id: string) {
    return isPathActive("/") && activeSection.value === id;
  }

  const navItems = computed(() => {
    return [
      {
        link: "/#about",
        label: "About",
        isActive: () => isSectionActive("about"),
      },
      {
        link: "/#projects",
        label: "Projects",
        isActive: () => isSectionActive("projects"),
      },
      {
        link: "/#experience",
        label: "Experience",
        isActive: () => isSectionActive("experience"),
      },
      {
        link: "/resume",
        label: "Resume",
        isActive: () => isPathActive("/resume"),
      },
      {
        link: "/posts",
        label: "Blog",
        isActive: () => isPathActive("/posts", true),
      },
    ] as NavItem[];
  });

  return {
    isSectionActive,
    isPathActive,
    activeSection,
    navItems,
  };
}
