<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import MiniSearch from "minisearch";
import { SearchItem } from "@typedefs";
import { data as postItems } from "../../content/posts/search.data.ts";
import { useRouter } from "vitepress";
import { useNavPanels } from "@composables/useNavPanels.ts";

const router = useRouter();
const { isSearchOpen, openSearch, closeAll } = useNavPanels();

const STATIC_ITEMS: SearchItem[] = [
  {
    type: "page",
    title: "Home",
    desc: "About, projects, experience, latest posts",
    href: "/",
    kw: "home about projects experience",
  },
  {
    type: "page",
    title: "Resume",
    desc: "Full professional history & download",
    href: "/resume",
    kw: "resume cv work history",
  },
  {
    type: "page",
    title: "Blog",
    desc: "All posts, filterable by tag",
    href: "/posts",
    kw: "blog posts writing articles",
  },
  {
    type: "page",
    title: "Grimicorn Theme Examples",
    desc: "Light & Dark VS Code Theme Examples",
    href: "/grimicorn-themes",
    kw: "themes vs code",
  },
];

const ALL_ITEMS: SearchItem[] = [...STATIC_ITEMS, ...postItems];

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

const query = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const activeIndex = ref(-1);
const resultRefs = ref<HTMLElement[]>([]);

const filteredResults = computed((): SearchItem[] => {
  const q = query.value.trim();
  if (!q) return ALL_ITEMS.slice(0, 8);
  return ms.search(q).slice(0, 8) as unknown as SearchItem[];
});

watch(filteredResults, () => {
  activeIndex.value = -1;
  resultRefs.value = [];
});

watch(activeIndex, (i) => {
  nextTick(() => {
    resultRefs.value[i]?.scrollIntoView({ block: "nearest" });
  });
});

function highlight(str: string, q: string): string {
  if (!q) return str;
  const i = str.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return str;
  return (
    str.slice(0, i) +
    '<mark class="bg-accent-dim text-accent rounded-[2px] px-0.5">' +
    str.slice(i, i + q.length) +
    "</mark>" +
    str.slice(i + q.length)
  );
}

async function open() {
  openSearch();
  await nextTick();
  inputRef.value?.focus();
}

function close() {
  closeAll();
  query.value = "";
  activeIndex.value = -1;
}

function toggle() {
  isSearchOpen.value ? close() : open();
}

function navigate(href: string) {
  close();
  router.go(href);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isSearchOpen.value) {
    close();
  } else if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    toggle();
  } else if (
    e.key === "/" &&
    !isSearchOpen.value &&
    document.activeElement === document.body
  ) {
    e.preventDefault();
    open();
  } else if (isSearchOpen.value) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex.value =
        activeIndex.value >= filteredResults.value.length - 1
          ? 0
          : activeIndex.value + 1;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeIndex.value === 0) {
        activeIndex.value = -1;
        nextTick(() => inputRef.value?.focus());
      } else if (activeIndex.value > 0) {
        activeIndex.value -= 1;
      }
    } else if (e.key === "Enter" && activeIndex.value >= 0) {
      e.preventDefault();
      navigate(filteredResults.value[activeIndex.value].href);
    }
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
          <div
            v-if="query && !filteredResults.length"
            class="text-fg-subtle py-8 text-center font-mono text-[0.78rem]"
          >
            no results for "{{ query }}"
          </div>
          <a
            v-for="(item, index) in filteredResults"
            :key="item.href + item.title"
            :ref="
              (el) => {
                if (el) resultRefs[index] = el as HTMLElement;
              }
            "
            class="search-result group -mx-3 flex cursor-pointer items-center gap-4 rounded border px-3 py-3 no-underline transition-colors"
            :class="
              index === activeIndex
                ? 'border-line bg-accent-dim/30'
                : 'hover:border-line hover:bg-accent-dim/30 border-transparent'
            "
            @click.prevent="navigate(item.href)"
            @mousemove="activeIndex = index"
          >
            <span
              class="text-accent bg-accent-dim w-[60px] shrink-0 rounded-[2px] px-1.5 py-0.5 text-center font-mono text-[0.6rem] tracking-[0.08em] uppercase"
              >{{ item.type }}</span
            >
            <div class="min-w-0 flex-1">
              <div
                class="text-fg truncate font-mono text-[0.85rem] font-semibold"
                v-html="highlight(item.title, query.trim())"
              ></div>
              <div
                class="text-fg-muted mt-0.5 truncate font-mono text-[0.68rem]"
                v-html="highlight(item.desc, query.trim())"
              ></div>
            </div>
            <svg
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

    <div
      class="no-print bg-fg/20 fixed inset-0 z-80 transition-[opacity,visibility] duration-300"
      :class="isSearchOpen ? 'visible opacity-100' : 'invisible opacity-0'"
      @click="close"
    ></div>
  </Teleport>
</template>
