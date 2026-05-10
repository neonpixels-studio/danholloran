<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { SearchItem } from "@typedefs";

// @todo Convert to a search index solution + make dynamic
const PAGES: SearchItem[] = [
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
    type: "post",
    title: "Building a High-Performance SPA with Vue 3 and Vite",
    desc: "development · Apr 28, 2026",
    href: "/posts/building-a-high-performance-spa-with-vue-3-and-vite",
    kw: "vue vite spa performance frontend",
  },
  {
    type: "post",
    title: "What a Career Sabbatical Actually Feels Like",
    desc: "career · Mar 15, 2026",
    href: "/posts/what-a-career-sabbatical-actually-feels-like",
    kw: "sabbatical career break travel",
  },
  {
    type: "post",
    title: "Photography in Patagonia",
    desc: "travel · Feb 20, 2026",
    href: "/posts/photography-in-patagonia",
    kw: "patagonia photography travel landscape",
  },
  {
    type: "post",
    title: "GraphQL vs REST: After 8 Years in Production",
    desc: "development · Jan 30, 2026",
    href: "/posts/graphql-vs-rest-after-8-years-in-production",
    kw: "graphql rest api backend",
  },
  {
    type: "post",
    title: "Mentorship Isn't About Having Answers",
    desc: "career · Jan 12, 2026",
    href: "/posts/mentorship-isnt-about-having-answers",
    kw: "mentorship leadership career",
  },
  {
    type: "post",
    title: "Street Photography in Tokyo at 5am",
    desc: "photography · Dec 8, 2025",
    href: "/posts/street-photography-in-tokyo-at-5am",
    kw: "tokyo japan photography street",
  },
  {
    type: "post",
    title: "Why I'm Betting on Jamstack in 2026",
    desc: "development · Nov 22, 2025",
    href: "/posts/why-im-betting-on-jamstack-in-2026",
    kw: "jamstack static site generators",
  },
  {
    type: "post",
    title: "The Architecture Decision I Still Think About",
    desc: "career · Nov 5, 2025",
    href: "/posts/the-architecture-decision-i-still-think-about",
    kw: "architecture career decisions",
  },
  {
    type: "project",
    title: "Tradier Dash",
    desc: "@Tradier · Vue, Vite, Tailwind",
    href: "/#projects",
    kw: "tradier vue vite tailwind dashboard",
  },
  {
    type: "project",
    title: "Crossroads Church",
    desc: "@Ample · Gatsby, GraphQL, React",
    href: "/#projects",
    kw: "crossroads gatsby graphql react",
  },
  {
    type: "project",
    title: "Mike Albert Fleet",
    desc: "@Ample · React, Gatsby, GraphQL",
    href: "/#projects",
    kw: "mike albert fleet react",
  },
  {
    type: "project",
    title: "EHG Gear",
    desc: "@Matchbox · Vue, WooCommerce, WordPress",
    href: "/#projects",
    kw: "ehg gear ecommerce vue wordpress",
  },
];

const isOpen = ref(false);
const query = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

const filteredResults = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return PAGES.slice(0, 8);
  return PAGES.filter((p) =>
    (p.title + " " + p.desc + " " + p.kw).toLowerCase().includes(q),
  ).slice(0, 8);
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
  isOpen.value = true;
  await nextTick();
  inputRef.value?.focus();
}

function close() {
  isOpen.value = false;
  query.value = "";
}

function toggle() {
  isOpen.value ? close() : open();
}

function navigate(href: string) {
  close();
  // @todo Is there a better way to do this?
  window.location.href = href;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isOpen.value) {
    close();
  } else if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    toggle();
  } else if (
    e.key === "/" &&
    !isOpen.value &&
    document.activeElement === document.body
  ) {
    e.preventDefault();
    open();
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
        isOpen
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
            v-for="item in filteredResults"
            :key="item.href + item.title"
            class="search-result hover:border-line hover:bg-accent-dim/30 group -mx-3 flex cursor-pointer items-center gap-4 rounded border border-transparent px-3 py-3 no-underline transition-colors"
            @click.prevent="navigate(item.href)"
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
      :class="isOpen ? 'visible opacity-100' : 'invisible opacity-0'"
      @click="close"
    ></div>
  </Teleport>
</template>
