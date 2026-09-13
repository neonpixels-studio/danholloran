import { computed, onScopeDispose, ref } from "vue";
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
  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  onScopeDispose(() => clearTimeout(copyTimer));

  async function copyHex(hex: string, index: number) {
    try {
      await navigator.clipboard?.writeText(hex);
    } catch {
      // Clipboard blocked — still flash so the hex stays visible to copy by hand.
    }
    copiedIndex.value = index;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copiedIndex.value = null;
    }, COPY_FLASH_MS);
  }

  return {
    trackDownload,
    trackToolDownload,
    sortedTools,
    copiedIndex,
    copyHex,
  };
}
