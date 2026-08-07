import { ref, computed, onMounted, onUnmounted } from "vue";

type Theme = "auto" | "light" | "dark";

const STORAGE_KEY = "vitepress-theme-appearance";
const DEFAULT_THEME: Theme = "auto";
// Legal persisted values (data concern), independent of CYCLE_ORDER (the UI toggle sequence).
const THEMES: readonly Theme[] = ["auto", "light", "dark"];
const CYCLE_ORDER: Theme[] = ["auto", "light", "dark"];

function isTheme(value: string | null): value is Theme {
  return THEMES.includes(value as Theme);
}

export function readStored(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch (error) {
    console.warn(`useAppearance: could not read stored theme — ${error}`);
    return DEFAULT_THEME;
  }
}

function persist(value: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    // Storage blocked (private mode / restricted iframe): theme still applies for this session.
    console.warn(`useAppearance: could not persist theme — ${error}`);
  }
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme): void {
  const isDark = theme === "dark" || (theme === "auto" && prefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

export function useAppearance() {
  const theme = ref<Theme>(DEFAULT_THEME);
  let mediaQuery: MediaQueryList | null = null;

  function setTheme(value: Theme): void {
    theme.value = value;
    applyTheme(value);
    persist(value);
  }

  function cycleTheme(): void {
    const next =
      CYCLE_ORDER[(CYCLE_ORDER.indexOf(theme.value) + 1) % CYCLE_ORDER.length];
    setTheme(next);
  }

  function onSystemChange(): void {
    if (theme.value === "auto") {
      applyTheme("auto");
    }
  }

  const themeIcon = computed<"monitor" | "sun" | "moon">(() => {
    if (theme.value === "dark") return "moon";
    if (theme.value === "light") return "sun";
    return "monitor";
  });

  onMounted(() => {
    theme.value = readStored();
    applyTheme(theme.value);
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", onSystemChange);
  });

  onUnmounted(() => {
    mediaQuery?.removeEventListener("change", onSystemChange);
  });

  return { theme, themeIcon, cycleTheme };
}
