import { computed, getCurrentScope, onScopeDispose, ref, type Ref } from "vue";
import { useAnalytics } from "@composables/useAnalytics";
import type { GrimicornTool, GrimicornToolFile } from "@typedefs";

const COPY_FLASH_MS = 1100;

type DownloadFormat = "palette" | "bundle" | "tool";

/** Featured tools first, then alphabetical by name within each group. */
function byFeaturedThenName(
  first: GrimicornTool,
  second: GrimicornTool,
): number {
  const byFeatured =
    Number(Boolean(second.featured)) - Number(Boolean(first.featured));
  if (byFeatured !== 0) {
    return byFeatured;
  }
  return first.name.localeCompare(second.name);
}

/**
 * Shared behavior behind every Grimicorn theme download page: sorting the
 * tool list, tracking download clicks, and flashing "copied!" on swatch
 * click. Extracted so GrimicornThemesView and GrimicornNeonThemesView — which
 * only differ in their data source — can't drift out of sync.
 */
export function useGrimicornToolDownloads(
  themeSlug: string,
  tools: GrimicornTool[],
) {
  const { trackEvent } = useAnalytics();

  function trackDownload(
    format: DownloadFormat,
    params: Record<string, unknown> = {},
  ) {
    // Scoped fields last so a caller can't accidentally clobber theme/format
    // by including those keys in params.
    trackEvent("theme_download", { ...params, theme: themeSlug, format });
  }

  function trackToolDownload(toolName: string, file: GrimicornToolFile) {
    trackDownload("tool", {
      tool: toolName,
      variant: file.label,
      asset: file.download,
    });
  }

  const sortedTools = computed(() => [...tools].sort(byFeaturedThenName));

  const copiedIndex = ref<number | null>(null);
  const copyFailedIndex = ref<number | null>(null);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  // Guarded: callers outside a component/effect scope (e.g. calling this
  // composable directly in a unit test) have nothing to dispose into, and an
  // unconditional call would only log a Vue dev warning.
  if (getCurrentScope()) {
    onScopeDispose(() => clearTimeout(copyTimer));
  }

  /** Flashes `index` on `target`, clearing whichever ref flashed last. */
  function flashFeedback(target: Ref<number | null>, index: number) {
    copiedIndex.value = null;
    copyFailedIndex.value = null;
    target.value = index;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      target.value = null;
    }, COPY_FLASH_MS);
  }

  async function copyHex(hex: string, index: number) {
    // Await the write before flashing anything: only a resolved write counts
    // as "copied!", and a rejection (permission denial, missing clipboard
    // API) must surface as a visible failure rather than a silent success.
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(hex);
      flashFeedback(copiedIndex, index);
    } catch {
      flashFeedback(copyFailedIndex, index);
    }
  }

  return {
    trackDownload,
    trackToolDownload,
    sortedTools,
    copiedIndex,
    copyFailedIndex,
    copyHex,
  };
}
