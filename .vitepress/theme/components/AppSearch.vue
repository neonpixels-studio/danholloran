<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  useId,
} from "vue";
import MiniSearch from "minisearch";
import { SearchItem } from "@typedefs";
import { data as postItems } from "../../content/posts/search.data.ts";
import { data as staticItems } from "../../data/staticSearch.data.ts";
import {
  mergeSearchIndex,
  buildEmptyQueryResults,
  SEARCH_PANEL_SIZE,
} from "../../data/searchIndex.ts";
import { useRouter } from "vitepress";
import { useNavPanels } from "@composables/useNavPanels.ts";
import { useAnalytics } from "@composables/useAnalytics.ts";
import { highlightMatch } from "@utils/highlightMatch.ts";

// Debounces the query-result analytics ping until typing pauses, so a query
// typed character-by-character fires one event instead of one per keystroke.
const QUERY_TRACK_DEBOUNCE_MS = 500;
// GA4 truncates event param values at 100 characters; cap before sending so a
// long paste doesn't land in reports half-mangled.
const MAX_TRACKED_QUERY_LENGTH = 100;
const SEARCH_QUERY_EVENT = "search_query";
const SEARCH_NO_RESULTS_EVENT = "search_no_results";
const SEARCH_RESULT_CLICK_EVENT = "search_result_click";
const REDACTED_QUERY = "[redacted]";

// Strip common phone-number separators before testing for a long digit run,
// so "555-123-4567" and "(555) 123-4567" still count as PII-shaped rather
// than a handful of short digit groups.
const QUERY_SEPARATORS = /[\s().+-]/g;
// A query shaped like an email address or a long digit run (phone, account
// number, etc.) is redacted rather than sent verbatim — truncation alone
// doesn't stop PII from reaching GA4.
const PII_SHAPED_QUERY = /@|\d{7,}/;

// Trims and caps the query for dedupe/lookup purposes. Kept separate from
// redaction: two different PII-shaped queries (e.g. two different emails)
// must still dedupe as distinct searches, not collapse into one because they
// redact to the same placeholder.
function normalizeQuery(value: string): string {
  return value.trim().slice(0, MAX_TRACKED_QUERY_LENGTH);
}

// Redacts a normalized query right before it's sent to analytics.
function redactQuery(normalizedQuery: string): string {
  const compacted = normalizedQuery.replace(QUERY_SEPARATORS, "");
  return PII_SHAPED_QUERY.test(compacted) ? REDACTED_QUERY : normalizedQuery;
}

const router = useRouter();
const { isSearchOpen, openSearch, closeAll } = useNavPanels();
const { trackEvent } = useAnalytics();

const ALL_ITEMS: SearchItem[] = mergeSearchIndex(staticItems, postItems);

const ms = new MiniSearch<SearchItem & { id: number }>({
  fields: ["title", "desc", "kw"],
  storeFields: ["type", "title", "desc", "href"],
  searchOptions: {
    boost: { title: 3, kw: 2 },
    fuzzy: 0.2,
    prefix: true,
  },
});
ms.addAll(ALL_ITEMS.map((item, id) => ({ ...item, id })));

// Per-instance prefix keeps combobox ids unique if the component mounts more than once.
const componentUid = useId();
const LISTBOX_ID = `app-search-listbox-${componentUid}`;

function optionId(index: number): string {
  return `app-search-option-${componentUid}-${index}`;
}

const query = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const activeIndex = ref(-1);
const resultRefs = ref<HTMLElement[]>([]);

const filteredResults = computed((): SearchItem[] => {
  const q = query.value.trim();
  if (!q) {
    return buildEmptyQueryResults(ALL_ITEMS);
  }
  return ms.search(q).slice(0, SEARCH_PANEL_SIZE) as unknown as SearchItem[];
});

const activeDescendantId = computed(() => {
  if (activeIndex.value < 0) {
    return undefined;
  }
  if (activeIndex.value >= filteredResults.value.length) {
    return undefined;
  }
  return optionId(activeIndex.value);
});

const isListboxExpanded = computed(
  () => isSearchOpen.value && filteredResults.value.length > 0,
);

const resultCountLabel = computed(() => {
  if (!query.value) {
    return "";
  }
  const count = filteredResults.value.length;
  return `${count} ${count === 1 ? "result" : "results"}`;
});

const showNoResults = computed(
  () => query.value.length > 0 && filteredResults.value.length === 0,
);

watch(filteredResults, () => {
  activeIndex.value = -1;
  resultRefs.value = [];
});

let queryTrackTimer: ReturnType<typeof setTimeout> | undefined;
// Last *normalized* (pre-redaction) query actually sent to analytics, so an
// edit that trims back down to an already-tracked value (trailing space,
// type-then-backspace) doesn't double-count. Reset to "" whenever the query
// goes empty, so the same term searched again in a later session tracks as a
// fresh occurrence. Deliberately compared before redaction so two distinct
// PII-shaped queries (e.g. two different emails) don't collapse into one
// dedupe bucket just because they redact to the same placeholder.
let lastTrackedQuery = "";

// A hit reports how many results the panel showed, a miss reports the
// zero-result query, so search quality can be measured. Skips a repeat of
// the last tracked query.
function trackQuerySettled(normalizedQuery: string) {
  if (normalizedQuery === lastTrackedQuery) {
    return;
  }
  lastTrackedQuery = normalizedQuery;
  const resultsShown = filteredResults.value.length;
  const trackedQuery = redactQuery(normalizedQuery);
  if (resultsShown === 0) {
    trackEvent(SEARCH_NO_RESULTS_EVENT, { query: trackedQuery });
    return;
  }
  trackEvent(SEARCH_QUERY_EVENT, {
    query: trackedQuery,
    results_shown: resultsShown,
  });
}

// Cancels any pending debounce and, if a query is still in flight, tracks it
// immediately. Called directly from navigate() (so a fast click/Enter still
// reports the query it acted on) and from the isSearchOpen watcher below
// (so any other dismissal doesn't leave the debounce to fire, or drop, on
// its own) — either way it runs before `query` gets cleared out from under
// a timer that hasn't fired yet.
function flushQueryTracking() {
  clearTimeout(queryTrackTimer);
  queryTrackTimer = undefined;
  const normalizedQuery = normalizeQuery(query.value);
  if (normalizedQuery) {
    trackQuerySettled(normalizedQuery);
  }
}

// Fires exactly one event per settled query, debounced so a query typed
// character-by-character doesn't fire one event per keystroke.
watch(query, (value) => {
  clearTimeout(queryTrackTimer);
  const normalizedQuery = normalizeQuery(value);
  if (!normalizedQuery) {
    lastTrackedQuery = "";
    return;
  }
  queryTrackTimer = setTimeout(
    () => trackQuerySettled(normalizedQuery),
    QUERY_TRACK_DEBOUNCE_MS,
  );
});

// The shared nav-panel store (useNavPanels) can close this panel without
// this component's own close() ever running — e.g. switching to the mobile
// menu while search is open. Watching isSearchOpen (rather than only
// handling it in close()) guarantees a pending debounce timer is flushed and
// the query cleared however the panel closes, not just via this file's own
// dismissal handlers.
watch(isSearchOpen, (isOpen) => {
  if (isOpen) {
    return;
  }
  flushQueryTracking();
  query.value = "";
  activeIndex.value = -1;
});

watch(activeIndex, (i) => {
  nextTick(() => {
    resultRefs.value[i]?.scrollIntoView({ block: "nearest" });
  });
});

async function open() {
  openSearch();
  await nextTick();
  inputRef.value?.focus();
}

// Flushing/clearing itself is handled by the isSearchOpen watcher above,
// which fires for every way the panel can close, this one included.
function close() {
  closeAll();
}

function toggle() {
  isSearchOpen.value ? close() : open();
}

const EXTERNAL_PROTOCOLS = ["http:", "https:", "mailto:"];

function isExternal(href: string): boolean {
  if (href.startsWith("//")) {
    return true;
  }
  const scheme = href.match(/^[a-z][a-z0-9+.-]*:/i)?.[0].toLowerCase();
  if (!scheme) {
    return false;
  }
  return EXTERNAL_PROTOCOLS.includes(scheme);
}

function trackResultClick(item: SearchItem) {
  trackEvent(SEARCH_RESULT_CLICK_EVENT, {
    query: redactQuery(normalizeQuery(query.value)),
    href: item.href,
    type: item.type,
  });
}

function navigate(item: SearchItem) {
  // Flush first so search_query/search_no_results reaches analytics ahead of
  // the search_result_click it led to — funnels segment on that order.
  flushQueryTracking();
  trackResultClick(item);
  close();
  if (isExternal(item.href)) {
    window.location.href = item.href;
    return;
  }
  router.go(item.href);
}

function moveActiveDown() {
  if (!filteredResults.value.length) {
    return;
  }
  const isAtEnd = activeIndex.value >= filteredResults.value.length - 1;
  activeIndex.value = isAtEnd ? 0 : activeIndex.value + 1;
}

function moveActiveUp() {
  if (activeIndex.value === 0) {
    activeIndex.value = -1;
    nextTick(() => inputRef.value?.focus());
    return;
  }
  if (activeIndex.value > 0) {
    activeIndex.value -= 1;
  }
}

function onResultNavigation(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    moveActiveDown();
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    moveActiveUp();
    return;
  }
  if (e.key === "Enter" && activeIndex.value >= 0) {
    e.preventDefault();
    navigate(filteredResults.value[activeIndex.value]);
  }
}

function isToggleShortcut(e: KeyboardEvent): boolean {
  const isKKey = e.key === "k" || e.key === "K";
  return isKKey && (e.metaKey || e.ctrlKey);
}

function isSlashShortcut(e: KeyboardEvent): boolean {
  const isSlash = e.key === "/" && !isSearchOpen.value;
  return isSlash && document.activeElement === document.body;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isSearchOpen.value) {
    close();
    return;
  }
  if (isToggleShortcut(e)) {
    e.preventDefault();
    toggle();
    return;
  }
  if (isSlashShortcut(e)) {
    e.preventDefault();
    open();
    return;
  }
  if (isSearchOpen.value) {
    onResultNavigation(e);
  }
}

function onSearchToggleClick(e: MouseEvent) {
  if ((e.target as Element).closest("#searchToggle")) {
    e.preventDefault();
    toggle();
  }
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("click", onSearchToggleClick);
});
onUnmounted(() => {
  clearTimeout(queryTrackTimer);
  document.removeEventListener("keydown", onKeydown);
  document.removeEventListener("click", onSearchToggleClick);
});
</script>

<template>
  <Teleport to="body">
    <div
      class="no-print bg-bg/97 border-line fixed inset-x-0 top-[60px] z-90 border-b backdrop-blur-md transition-[transform,opacity,visibility] duration-300"
      :class="
        isSearchOpen
          ? 'visible translate-y-0 opacity-100'
          : 'invisible -translate-y-[120%] opacity-0'
      "
      style="box-shadow: 0 12px 40px rgba(17, 17, 16, 0.06)"
    >
      <div class="mx-auto max-w-[1100px] px-8 py-5 max-md:px-4">
        <div class="border-line flex items-center gap-4 border-b pb-3">
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            class="text-fg-subtle shrink-0"
          >
            <circle
              cx="7"
              cy="7"
              r="5"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M11 11L14 14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            role="combobox"
            aria-label="Search"
            aria-autocomplete="list"
            :aria-controls="LISTBOX_ID"
            :aria-expanded="isListboxExpanded"
            :aria-activedescendant="activeDescendantId"
            placeholder="search posts, projects, pages..."
            autocomplete="off"
            spellcheck="false"
            class="text-fg placeholder:text-fg-subtle min-w-0 flex-1 border-0 bg-transparent font-mono text-[1rem] outline-0"
            style="font-family: var(--font-mono)"
          />
          <kbd
            class="text-fg-subtle border-line rounded-[2px] border px-1.5 py-0.5 font-mono text-[0.62rem] tracking-[0.05em] max-md:hidden"
            >esc</kbd
          >
          <button
            aria-label="Close search"
            class="text-fg-subtle hover:text-accent cursor-pointer border-0 bg-transparent p-1 text-[1.4rem] leading-none transition-colors"
            @click="close"
          >
            ×
          </button>
        </div>

        <div class="mt-1 max-h-[60vh] overflow-y-auto">
          <div class="sr-only" role="status" aria-live="polite">
            {{ resultCountLabel }}
          </div>
          <div
            v-if="showNoResults"
            class="text-fg-subtle py-8 text-center font-mono text-[0.78rem]"
          >
            no results for "{{ query }}"
          </div>
          <div
            v-show="isListboxExpanded"
            :id="LISTBOX_ID"
            role="listbox"
            aria-label="Search results"
          >
            <a
              v-for="(item, index) in filteredResults"
              :id="optionId(index)"
              :key="item.href + item.title"
              :ref="
                (el) => {
                  if (el) resultRefs[index] = el as HTMLElement;
                }
              "
              role="option"
              tabindex="-1"
              :aria-selected="index === activeIndex"
              :href="item.href"
              class="search-result group -mx-3 flex cursor-pointer items-center gap-4 rounded border px-3 py-3 no-underline transition-colors"
              :class="
                index === activeIndex
                  ? 'border-line bg-accent-dim/30'
                  : 'hover:border-line hover:bg-accent-dim/30 border-transparent'
              "
              @click.prevent="navigate(item)"
              @mousemove="activeIndex = index"
            >
              <span
                class="text-on-accent-dim bg-accent-dim w-[60px] shrink-0 rounded-[2px] px-1.5 py-0.5 text-center font-mono text-[0.6rem] tracking-[0.08em] uppercase"
                >{{ item.type }}</span
              >
              <div class="min-w-0 flex-1">
                <div
                  class="text-fg truncate font-mono text-[0.85rem] font-semibold"
                  v-html="highlightMatch(item.title, query.trim())"
                ></div>
                <div
                  class="text-fg-muted mt-0.5 truncate font-mono text-[0.68rem]"
                  v-html="highlightMatch(item.desc, query.trim())"
                ></div>
              </div>
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                class="text-fg-subtle group-hover:text-accent shrink-0 transition-all group-hover:translate-x-0.5"
              >
                <path
                  d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div
      class="no-print bg-fg/20 fixed inset-0 z-80 transition-[opacity,visibility] duration-300"
      :class="isSearchOpen ? 'visible opacity-100' : 'invisible opacity-0'"
      @click="close"
    ></div>
  </Teleport>
</template>
