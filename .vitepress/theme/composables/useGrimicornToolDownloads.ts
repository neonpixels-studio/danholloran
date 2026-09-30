import { computed, getCurrentScope, onScopeDispose, ref, type Ref } from "vue";
import { useAnalytics } from "@composables/useAnalytics";
import type { GrimicornTool, GrimicornToolFile } from "@typedefs";

const COPY_FLASH_MS = 1100;

export const COPIED_LABEL = "copied!";
export const COPY_FAILED_LABEL = "couldn't copy";

type DownloadFormat = "palette" | "bundle" | "tool";

/** Isolates the external Clipboard API so `copyHex` stays testable without it. */
async function writeToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

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
  // Tags each copyHex call so a slow write that resolves after a later click
  // (or after the component unmounts) can't steal the flash — or plant a
  // stale failure — from whatever the user is now looking at.
  let latestCopyRequest = 0;
  // Guarded: callers outside a component/effect scope (e.g. calling this
  // composable directly in a unit test) have nothing to dispose into, and an
  // unconditional call would only log a Vue dev warning.
  if (getCurrentScope()) {
    onScopeDispose(() => {
      // Invalidates any write still in flight so it can't schedule a new
      // timer or write to these refs after this component is gone.
      latestCopyRequest++;
      clearTimeout(copyTimer);
    });
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
    const request = ++latestCopyRequest;
    const succeeded = await writeToClipboard(hex);
    if (request !== latestCopyRequest) {
      return;
    }
    flashFeedback(succeeded ? copiedIndex : copyFailedIndex, index);
  }

  function isCopied(index: number): boolean {
    return copiedIndex.value === index;
  }

  function isCopyFailed(index: number): boolean {
    return copyFailedIndex.value === index;
  }

  /** Shared label logic so both theme views render identical copy feedback. */
  function copyLabel(index: number, hex: string): string {
    if (isCopyFailed(index)) {
      return COPY_FAILED_LABEL;
    }
    if (isCopied(index)) {
      return COPIED_LABEL;
    }
    return hex;
  }

  return {
    trackDownload,
    trackToolDownload,
    sortedTools,
    copiedIndex,
    copyFailedIndex,
    isCopied,
    isCopyFailed,
    copyHex,
    copyLabel,
  };
}
