import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, it, expect } from "vitest";
import { resolveSiteData } from "vitepress";
import { STORAGE_KEY } from "../../theme/composables/useAppearance";
import { buildThemeSanitizeScript } from "../../theme/utils/themeStorageSanitizer";

function runScriptsAgainst(
  stored: string | null,
  osPrefersDark: boolean,
  scripts: string[],
) {
  const store = new Map<string, string>();
  if (stored !== null) {
    store.set(STORAGE_KEY, stored);
  }
  const classes = new Set<string>();
  const sandbox = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => store.delete(key),
    },
    window: { matchMedia: () => ({ matches: osPrefersDark }) },
    document: {
      documentElement: {
        classList: { add: (name: string) => classes.add(name) },
      },
    },
  };
  scripts.forEach((script) => runInNewContext(script, sandbox));
  return { store, isDark: classes.has("dark") };
}

async function vitepressScript(): Promise<string> {
  const siteData = await resolveSiteData("/virtual-root", {
    appearance: true,
    head: [],
  });
  const entry = siteData.head.find(
    ([, attrs]) => attrs?.id === "check-dark-mode",
  );
  if (!entry) {
    throw new Error("VitePress check-dark-mode head script not found");
  }
  return entry[2] as string;
}

describe("buildThemeSanitizeScript", () => {
  it.each(["banana", "Dark", "true", "{}"])(
    "makes corrupt value %j follow the OS preference (dark OS)",
    async (corrupt) => {
      const vitepress = await vitepressScript();

      const unsanitized = runScriptsAgainst(corrupt, true, [vitepress]);
      const sanitized = runScriptsAgainst(corrupt, true, [
        buildThemeSanitizeScript(),
        vitepress,
      ]);

      expect(unsanitized.isDark).toBe(false);
      expect(sanitized.isDark).toBe(true);
      expect(sanitized.store.has(STORAGE_KEY)).toBe(false);
    },
  );

  it.each(["auto", "light", "dark"])(
    "leaves valid value %s untouched",
    (valid) => {
      const { store } = runScriptsAgainst(valid, true, [
        buildThemeSanitizeScript(),
      ]);

      expect(store.get(STORAGE_KEY)).toBe(valid);
    },
  );

  it("does not write when nothing is stored", async () => {
    const vitepress = await vitepressScript();

    const { store, isDark } = runScriptsAgainst(null, true, [
      buildThemeSanitizeScript(),
      vitepress,
    ]);

    expect(isDark).toBe(true);
    expect(store.size).toBe(0);
  });

  it("swallows a storage failure after reaching storage", () => {
    let reads = 0;
    const sandbox = {
      localStorage: {
        getItem: () => {
          reads += 1;
          throw new Error("blocked");
        },
      },
    };

    expect(() =>
      runInNewContext(buildThemeSanitizeScript(), sandbox),
    ).not.toThrow();
    expect(reads).toBe(1);
  });

  it("is emitted before VitePress's script when placed first in head", async () => {
    const siteData = await resolveSiteData("/virtual-root", {
      appearance: true,
      head: [
        [
          "script",
          { id: "sanitize-theme-storage" },
          buildThemeSanitizeScript(),
        ],
      ],
    });
    const ids = siteData.head.map(([, attrs]) => attrs?.id);

    expect(ids.indexOf("sanitize-theme-storage")).toBe(0);
    expect(ids.indexOf("check-dark-mode")).toBeGreaterThan(0);
  });

  it("is registered in config.ts head", () => {
    const source = readFileSync(
      resolve(process.cwd(), ".vitepress/config.ts"),
      "utf8",
    );

    expect(source).toContain('id: "sanitize-theme-storage"');
    expect(source).toContain("buildThemeSanitizeScript()");
  });
});
