import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { createApp, defineComponent, type App } from "vue";
import {
  readStored,
  useAppearance,
} from "../../theme/composables/useAppearance";

const STORAGE_KEY = "vitepress-theme-appearance";
const DARK_CLASS = "dark";

const CHANGE_EVENT = "change";

type ChangeListener = (_event: MediaQueryListEvent) => void;

type ControllableMediaQuery = {
  mediaQuery: MediaQueryList;
  matchMediaSpy: MockInstance;
  emitSystemChange: (_matches: boolean) => void;
  listenerCount: () => number;
};

// A matchMedia stand-in whose `matches` and `change` listeners we drive by hand,
// so system-theme behavior is deterministic instead of tied to the real host.
// Both doubles honor the real contract: only `change` listeners are tracked and
// each is invoked with a MediaQueryListEvent, so a listener registered on the
// wrong event (or reading the event rather than re-querying) fails a test.
function createControllableMediaQuery(
  initialMatches: boolean,
): Omit<ControllableMediaQuery, "matchMediaSpy"> {
  const listeners: ChangeListener[] = [];
  const mediaQuery = {
    matches: initialMatches,
    addEventListener: vi.fn((event: string, listener: ChangeListener) => {
      if (event !== CHANGE_EVENT) {
        return;
      }
      listeners.push(listener);
    }),
    removeEventListener: vi.fn((event: string, listener: ChangeListener) => {
      if (event !== CHANGE_EVENT) {
        return;
      }
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }),
  } as unknown as MediaQueryList;

  function emitSystemChange(matches: boolean): void {
    (mediaQuery as unknown as { matches: boolean }).matches = matches;
    listeners
      .slice()
      .forEach((listener) => listener({ matches } as MediaQueryListEvent));
  }

  return {
    mediaQuery,
    emitSystemChange,
    listenerCount: () => listeners.length,
  };
}

// Every app mounted through withSetup is torn down in afterEach so no test leaks
// a live component holding a system-theme change listener into the next one.
const mountedApps: App[] = [];

function withSetup<T>(composable: () => T): { result: T; app: App } {
  let result!: T;
  const app = createApp(
    defineComponent({
      setup() {
        result = composable();
        return () => null;
      },
    }),
  );
  app.mount(document.createElement("div"));
  mountedApps.push(app);
  return { result, app };
}

function unmount(app: App): void {
  app.unmount();
  const index = mountedApps.indexOf(app);
  if (index !== -1) {
    mountedApps.splice(index, 1);
  }
}

function stubSystemDark(prefersDark: boolean): ControllableMediaQuery {
  const controllable = createControllableMediaQuery(prefersDark);
  const matchMediaSpy = vi
    .spyOn(window, "matchMedia")
    .mockReturnValue(controllable.mediaQuery);
  return { ...controllable, matchMediaSpy };
}

function isDocumentDark(): boolean {
  return document.documentElement.classList.contains(DARK_CLASS);
}

describe("useAppearance", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(DARK_CLASS);
  });

  afterEach(() => {
    mountedApps.splice(0).forEach((app) => app.unmount());
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

  describe("localStorage persistence", () => {
    it("reads the stored theme on mount", () => {
      stubSystemDark(false);
      localStorage.setItem(STORAGE_KEY, "dark");

      const { result } = withSetup(useAppearance);

      expect(result.theme.value).toBe("dark");
      expect(isDocumentDark()).toBe(true);
    });

    it("defaults to auto by reading storage, without persisting a default", () => {
      stubSystemDark(false);
      const getItemSpy = vi.spyOn(localStorage, "getItem");

      const { result } = withSetup(useAppearance);

      expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result.theme.value).toBe("auto");
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("resolves a corrupt stored value to the default (auto) on mount", () => {
      stubSystemDark(true);
      localStorage.setItem(STORAGE_KEY, "not-a-theme");

      const { result } = withSetup(useAppearance);

      expect(result.theme.value).toBe("auto");
      expect(isDocumentDark()).toBe(true);
    });

    it("persists every theme to localStorage as it is cycled", () => {
      stubSystemDark(false);

      const { result } = withSetup(useAppearance);

      result.cycleTheme();
      expect(localStorage.getItem(STORAGE_KEY)).toBe("light");

      result.cycleTheme();
      expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");

      result.cycleTheme();
      expect(localStorage.getItem(STORAGE_KEY)).toBe("auto");
    });

    it("keeps the applied theme when persistence throws", () => {
      stubSystemDark(false);

      const { result } = withSetup(useAppearance);
      result.cycleTheme(); // light
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => result.cycleTheme()).not.toThrow();
      expect(result.theme.value).toBe("dark");
      expect(isDocumentDark()).toBe(true);
    });
  });

  describe("matchMedia system-theme listener", () => {
    it("registers a change listener on mount", () => {
      const controllable = stubSystemDark(false);

      withSetup(useAppearance);

      expect(controllable.mediaQuery.addEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
      expect(controllable.listenerCount()).toBe(1);
    });

    it("re-applies dark when the system flips to dark while on auto", () => {
      const controllable = stubSystemDark(false);

      withSetup(useAppearance);
      expect(isDocumentDark()).toBe(false);

      controllable.emitSystemChange(true);
      expect(isDocumentDark()).toBe(true);
    });

    it("drops dark when the system flips to light while on auto", () => {
      const controllable = stubSystemDark(true);

      withSetup(useAppearance);
      expect(isDocumentDark()).toBe(true);

      controllable.emitSystemChange(false);
      expect(isDocumentDark()).toBe(false);
    });

    it("ignores system changes when the theme is not auto", () => {
      const controllable = stubSystemDark(false);

      const { result } = withSetup(useAppearance);
      result.cycleTheme(); // auto -> light, dark class removed
      expect(isDocumentDark()).toBe(false);

      controllable.emitSystemChange(true);
      expect(isDocumentDark()).toBe(false);
    });

    it("removes the change listener on unmount", () => {
      const controllable = stubSystemDark(false);

      const { app } = withSetup(useAppearance);
      unmount(app);

      expect(controllable.mediaQuery.removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
      expect(controllable.listenerCount()).toBe(0);
    });
  });

  describe("auto/light/dark cycle", () => {
    it("cycles auto -> light -> dark -> auto", () => {
      stubSystemDark(false);

      const { result } = withSetup(useAppearance);
      expect(result.theme.value).toBe("auto");

      result.cycleTheme();
      expect(result.theme.value).toBe("light");

      result.cycleTheme();
      expect(result.theme.value).toBe("dark");

      result.cycleTheme();
      expect(result.theme.value).toBe("auto");
    });

    it("maps each theme to its icon", () => {
      stubSystemDark(false);

      const { result } = withSetup(useAppearance);
      expect(result.themeIcon.value).toBe("monitor");

      result.cycleTheme();
      expect(result.themeIcon.value).toBe("sun");

      result.cycleTheme();
      expect(result.themeIcon.value).toBe("moon");
    });

    it("applies the dark class for an explicit dark theme", () => {
      stubSystemDark(false);

      const { result } = withSetup(useAppearance);
      result.cycleTheme(); // light
      result.cycleTheme(); // dark

      expect(isDocumentDark()).toBe(true);
    });

    it("re-consults the system preference when cycling back to auto", () => {
      stubSystemDark(true);

      const { result } = withSetup(useAppearance);
      result.cycleTheme(); // light
      expect(isDocumentDark()).toBe(false);

      result.cycleTheme(); // dark
      expect(isDocumentDark()).toBe(true);

      result.cycleTheme(); // auto, system prefers dark
      expect(result.theme.value).toBe("auto");
      expect(isDocumentDark()).toBe(true);
    });

    it("drops the dark class for an explicit light theme even when the system prefers dark", () => {
      stubSystemDark(true);

      const { result } = withSetup(useAppearance);
      expect(isDocumentDark()).toBe(true); // auto + system dark

      result.cycleTheme(); // light
      expect(isDocumentDark()).toBe(false);
    });

    it("follows the system preference while on auto", () => {
      const { matchMediaSpy } = stubSystemDark(true);

      withSetup(useAppearance);

      expect(isDocumentDark()).toBe(true);
      expect(matchMediaSpy).toHaveBeenCalledWith(
        "(prefers-color-scheme: dark)",
      );
    });
  });
});
