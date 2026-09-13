import { describe, it, expect, vi, afterEach } from "vitest";
import { effectScope } from "vue";
import { useGrimicornToolDownloads } from "../../theme/composables/useGrimicornToolDownloads";
import { mockGtag, clearGtag } from "../helpers/gtag";
import type { GrimicornTool } from "../../types/grimicornTheme";

const THEME_SLUG = "grimicorn-test";
const FLASH_MS = 1100;

function tool(overrides: Partial<GrimicornTool> = {}): GrimicornTool {
  return {
    name: "Editor",
    kind: "editor",
    desc: "desc",
    files: [{ label: "dark", href: "/editor-dark", download: "editor-dark" }],
    install: "install",
    docs: "https://example.com",
    ...overrides,
  };
}

describe("useGrimicornToolDownloads", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    clearGtag();
  });

  describe("sortedTools", () => {
    it("puts featured tools first, then sorts alphabetically within each group", () => {
      const tools = [
        tool({ name: "Zed" }),
        tool({ name: "Alpha", featured: true }),
        tool({ name: "Beta" }),
        tool({ name: "Charlie", featured: true }),
      ];
      const { sortedTools } = useGrimicornToolDownloads(THEME_SLUG, tools);

      expect(sortedTools.value.map((entry) => entry.name)).toEqual([
        "Alpha",
        "Charlie",
        "Beta",
        "Zed",
      ]);
    });

    it("does not mutate the source array", () => {
      const tools = [tool({ name: "Zed" }), tool({ name: "Alpha" })];
      const { sortedTools } = useGrimicornToolDownloads(THEME_SLUG, tools);

      expect(sortedTools.value.map((entry) => entry.name)).toEqual([
        "Alpha",
        "Zed",
      ]);
      expect(tools.map((entry) => entry.name)).toEqual(["Zed", "Alpha"]);
    });
  });

  describe("copyHex", () => {
    it("flashes the copied index and clears it after the flash duration", async () => {
      vi.useFakeTimers();
      const { copyHex, copiedIndex } = useGrimicornToolDownloads(
        THEME_SLUG,
        [],
      );

      await copyHex("#123456", 2);

      expect(copiedIndex.value).toBe(2);

      vi.advanceTimersByTime(FLASH_MS);

      expect(copiedIndex.value).toBeNull();
    });

    it("restarts the flash timer when copying again before it clears", async () => {
      vi.useFakeTimers();
      const { copyHex, copiedIndex } = useGrimicornToolDownloads(
        THEME_SLUG,
        [],
      );

      await copyHex("#123456", 0);
      vi.advanceTimersByTime(FLASH_MS - 1);
      await copyHex("#abcdef", 1);
      vi.advanceTimersByTime(FLASH_MS - 1);

      expect(copiedIndex.value).toBe(1);

      vi.advanceTimersByTime(1);

      expect(copiedIndex.value).toBeNull();
    });

    it("writes the hex to the clipboard", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { clipboard: { writeText } });
      const { copyHex } = useGrimicornToolDownloads(THEME_SLUG, []);

      await copyHex("#123456", 0);

      expect(writeText).toHaveBeenCalledWith("#123456");
    });

    it("still flashes the copied index when the clipboard write is blocked", async () => {
      const writeText = vi.fn().mockRejectedValue(new Error("denied"));
      vi.stubGlobal("navigator", { clipboard: { writeText } });
      const { copyHex, copiedIndex } = useGrimicornToolDownloads(
        THEME_SLUG,
        [],
      );

      await copyHex("#123456", 3);

      expect(copiedIndex.value).toBe(3);
    });

    it("still flashes the copied index when the clipboard API is unavailable", async () => {
      vi.stubGlobal("navigator", {});
      const { copyHex, copiedIndex } = useGrimicornToolDownloads(
        THEME_SLUG,
        [],
      );

      await copyHex("#123456", 1);

      expect(copiedIndex.value).toBe(1);
    });

    it("clears the pending flash timer when its effect scope is disposed", async () => {
      vi.useFakeTimers();
      const scope = effectScope();
      const { copyHex, copiedIndex } = scope.run(() =>
        useGrimicornToolDownloads(THEME_SLUG, []),
      )!;

      await copyHex("#123456", 0);
      scope.stop();
      vi.advanceTimersByTime(FLASH_MS);

      // The timer's clearTimeout ran on dispose, so the flash is never reset.
      expect(copiedIndex.value).toBe(0);
    });
  });

  describe("trackDownload / trackToolDownload", () => {
    it("tracks a theme_download event scoped to the theme slug", () => {
      const gtag = mockGtag();
      const { trackDownload } = useGrimicornToolDownloads(THEME_SLUG, []);

      trackDownload("bundle", { asset: "theme.zip" });

      expect(gtag).toHaveBeenCalledWith("event", "theme_download", {
        theme: THEME_SLUG,
        format: "bundle",
        asset: "theme.zip",
      });
    });

    it("tracks a tool download with its variant and asset", () => {
      const gtag = mockGtag();
      const { trackToolDownload } = useGrimicornToolDownloads(THEME_SLUG, []);

      trackToolDownload("Editor", {
        label: "dark",
        href: "/editor-dark",
        download: "editor-dark",
      });

      expect(gtag).toHaveBeenCalledWith("event", "theme_download", {
        theme: THEME_SLUG,
        format: "tool",
        tool: "Editor",
        variant: "dark",
        asset: "editor-dark",
      });
    });

    it("keeps the scoped theme and format even if params tries to override them", () => {
      const gtag = mockGtag();
      const { trackDownload } = useGrimicornToolDownloads(THEME_SLUG, []);

      trackDownload("bundle", { theme: "other-theme", format: "palette" });

      expect(gtag).toHaveBeenCalledWith("event", "theme_download", {
        theme: THEME_SLUG,
        format: "bundle",
      });
    });
  });
});
