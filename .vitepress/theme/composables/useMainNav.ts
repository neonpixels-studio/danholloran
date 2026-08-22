import { NavItem } from "@typedefs";
import { useRoute } from "vitepress";
import { computed, ref } from "vue";

type IsPathActive = (_path: string, _startsWith?: boolean) => boolean;
type IsSectionActive = (_id: string) => boolean;

function buildNavItems(
  isPathActive: IsPathActive,
  isSectionActive: IsSectionActive,
): NavItem[] {
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
      link: "/posts/",
      label: "Blog",
      isActive: () => isPathActive("/posts", true),
    },
    {
      link: "/themes/grimicorn",
      label: "Themes",
      isActive: () => isPathActive("/themes", true),
      children: [
        {
          link: "/themes/grimicorn",
          label: "Grimicorn",
          isActive: () => isPathActive("/themes/grimicorn"),
        },
        {
          link: "/themes/grimicorn-neon",
          label: "Grimicorn Neon",
          isActive: () => isPathActive("/themes/grimicorn-neon"),
        },
      ],
    },
  ];
}

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

  const navItems = computed(() => buildNavItems(isPathActive, isSectionActive));

  return {
    isSectionActive,
    isPathActive,
    activeSection,
    navItems,
  };
}
