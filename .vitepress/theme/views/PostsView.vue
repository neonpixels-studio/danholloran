<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { Post } from "@typedefs";

const { posts } = defineProps<{
  posts: Post[];
}>();

const ALL_TOPIC = "all";
const ALL_TAG = "all";
const topics = [
  ALL_TOPIC,
  ...new Set(posts.map((post) => post.frontmatter.topic)),
];
const FIRST_PAGE_SIZE = 10;
const REST_PAGE_SIZE = 9;
const currentTopic = ref<string>(ALL_TOPIC);
const currentTag = ref<string>(ALL_TAG);
const currentPage = ref<number>(1);

const filtered = computed(() => {
  let result = posts;
  if (currentTopic.value !== ALL_TOPIC) {
    result = result.filter((p) => p.frontmatter.topic === currentTopic.value);
  }
  if (currentTag.value !== ALL_TAG) {
    result = result.filter((p) =>
      p.frontmatter.tags.includes(currentTag.value),
    );
  }
  return result;
});

const totalPages = computed(() => {
  const n = filtered.value.length;
  if (n <= FIRST_PAGE_SIZE) return 1;
  return 1 + Math.ceil((n - FIRST_PAGE_SIZE) / REST_PAGE_SIZE);
});

const setUrlParams = (topic?: string, page?: number | string, tag?: string) => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("topic", topic ?? ALL_TOPIC);
  url.searchParams.set("tag", tag ?? ALL_TAG);
  url.searchParams.set("page", String(page ?? 1));
  history.pushState({}, "", url.toString());
};

const pagePosts = computed(() => {
  if (currentPage.value === 1) {
    return filtered.value.slice(0, FIRST_PAGE_SIZE);
  }
  const start = FIRST_PAGE_SIZE + (currentPage.value - 2) * REST_PAGE_SIZE;
  return filtered.value.slice(start, start + REST_PAGE_SIZE);
});

function setTopic(f: string) {
  currentTopic.value = f;
  currentPage.value = 1;
  setUrlParams(currentTopic.value, currentPage.value, currentTag.value);
}

function setTag(t: string) {
  currentTag.value = t;
  currentPage.value = 1;
  setUrlParams(currentTopic.value, currentPage.value, currentTag.value);
}

function goPage(n: number) {
  if (n < 1 || n > totalPages.value) return;
  currentPage.value = n;
  setUrlParams(currentTopic.value, currentPage.value, currentTag.value);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const pageNumbers = computed(() => {
  const numbers: (number | "…")[] = [];
  for (let i = 1; i <= totalPages.value; i++) {
    if (
      i === 1 ||
      i === totalPages.value ||
      Math.abs(i - currentPage.value) <= 1
    ) {
      numbers.push(i);
    } else if (Math.abs(i - currentPage.value) === 2) {
      numbers.push("…");
    }
  }
  return [...new Set(numbers)];
});

const syncFromUrl = () => {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  currentTopic.value = p.get("topic") || ALL_TOPIC;
  currentTag.value = p.get("tag") || ALL_TAG;
  currentPage.value = parseInt(p.get("page") || "1") || 1;
};

let fadeObserver: IntersectionObserver | null = null;

const observeFadeIns = () => {
  if (!fadeObserver) return;
  document
    .querySelectorAll(".fade-in:not(.visible)")
    .forEach((el) => fadeObserver!.observe(el));
};

// Re-observe after every pagePosts change so new cards get the fade-in treatment
watch(pagePosts, observeFadeIns, { flush: "post" });

onMounted(() => {
  syncFromUrl();
  window.addEventListener("popstate", syncFromUrl);

  fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          fadeObserver?.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  // nextTick ensures syncFromUrl's reactive updates have been applied to the DOM
  nextTick(observeFadeIns);
});

onUnmounted(() => {
  window.removeEventListener("popstate", syncFromUrl);
  fadeObserver?.disconnect();
  fadeObserver = null;
});
</script>

<template>
  <header class="fade-in bg-topography-edge mx-auto max-w-275 px-8 pt-35 pb-12">
    <div
      class="text-accent mb-4 font-mono text-[0.7rem] -tracking-widest uppercase"
    >
      // writing
    </div>
    <h1
      class="mb-4 font-mono leading-[1.1] font-bold"
      style="font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -0.04em"
    >
      Thoughts on code,<br />craft &amp; exploration.
    </h1>
    <p class="text-fg-muted max-w-120 text-base">
      A mix of technical deep-dives, career reflections, and dispatches from the
      road.
    </p>
  </header>

  <div
    v-if="topics.length > 2"
    class="fade-in mx-auto mb-4 flex max-w-275 flex-wrap items-center gap-2 px-8"
  >
    <span class="text-fg-subtle font-mono text-[0.72rem] lowercase"
      >topic:</span
    >
    <button
      v-for="f in topics"
      :key="f"
      class="filter-btn border-line text-fg-muted hover:border-accent hover:text-accent inline-flex cursor-pointer items-center gap-1.5 rounded-xs border bg-transparent px-3 py-1.5 font-mono text-[0.72rem] tracking-[0.02em] lowercase transition-all"
      :class="{ active: currentTopic === f }"
      @click="setTopic(currentTopic === f && f !== ALL_TOPIC ? ALL_TOPIC : f)"
    >
      {{ f
      }}<span v-if="currentTopic === f && f !== ALL_TOPIC" aria-hidden="true"
        >×</span
      >
    </button>
  </div>

  <div
    v-if="currentTag !== ALL_TAG"
    class="fade-in mx-auto mb-12 flex max-w-275 flex-wrap items-center gap-2 px-8"
  >
    <span class="text-fg-subtle font-mono text-[0.72rem] lowercase">tag:</span>
    <button
      class="filter-btn border-line text-fg-muted hover:border-accent hover:text-accent active inline-flex cursor-pointer items-center gap-1.5 rounded-xs border bg-transparent px-3 py-1.5 font-mono text-[0.72rem] tracking-[0.02em] lowercase transition-all"
      @click="setTag(ALL_TAG)"
    >
      #{{ currentTag }} <span aria-hidden="true">×</span>
    </button>
  </div>

  <div
    v-if="filtered.length === 0"
    class="mx-auto max-w-275 px-8 pt-8 pb-24 text-center"
  >
    <p class="text-fg-muted font-mono text-[0.9rem]">
      No posts found for the current filters.
    </p>
    <button
      class="text-accent mt-4 cursor-pointer bg-transparent font-mono text-[0.8rem] underline"
      @click="
        setTopic(ALL_TOPIC);
        setTag(ALL_TAG);
      "
    >
      clear all filters
    </button>
  </div>

  <div
    v-else
    class="mx-auto grid max-w-275 gap-6 px-8"
    style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))"
  >
    <a
      v-for="(post, i) in pagePosts"
      :key="post.frontmatter.slug"
      :href="post.url"
      class="fade-in border-line text-fg bg-bg hover:border-accent flex flex-col overflow-hidden rounded border no-underline transition-[border-color,transform] hover:-translate-y-0.5"
      :class="{
        'col-span-full flex-row! max-md:flex-col!':
          currentPage === 1 && i === 0,
      }"
      :style="`transition-delay:${i * 60}ms`"
    >
      <div
        class="aspect-video shrink-0 overflow-hidden bg-[#e8e6e1]"
        :class="
          currentPage === 1 && i === 0
            ? 'aspect-auto w-[45%] max-md:aspect-video max-md:w-full'
            : ''
        "
      >
        <img
          :src="post.frontmatter.image"
          class="object.fit h-full w-full"
          :alt="`${post.frontmatter.title} thumbnail`"
        />
      </div>
      <div class="flex flex-1 flex-col p-6">
        <div class="mb-3 flex flex-wrap items-center gap-3">
          <span
            class="text-accent bg-accent-dim rounded-xs px-2 py-0.5 font-mono text-[0.62rem] font-semibold tracking-[0.08em] uppercase"
            >{{ post.frontmatter.topic }}</span
          >
          <span class="text-fg-subtle font-mono text-[0.68rem]">{{
            formatDate(post.frontmatter.date)
          }}</span>
          <span class="text-fg-subtle font-mono text-[0.68rem]"
            >· {{ post.frontmatter.readTime }} min</span
          >
        </div>
        <div
          class="mb-3 font-mono leading-[1.3] font-bold tracking-[-0.03em]"
          :class="
            currentPage === 1 && i === 0 ? 'text-[1.4rem]' : 'text-[1.05rem]'
          "
        >
          {{ post.frontmatter.title }}
        </div>
        <div class="text-fg-muted mb-4 flex-1 text-[0.88rem] leading-[1.65]">
          {{ post.frontmatter.description }}
        </div>
        <div class="mt-auto flex items-center justify-between">
          <span class="text-accent font-mono text-[0.72rem]">read more →</span>
        </div>
      </div>
    </a>
  </div>

  <div
    v-if="totalPages > 1"
    class="mx-auto mt-16 mb-24 flex max-w-275 items-center justify-center gap-2 px-8"
  >
    <button
      class="page-btn"
      :class="{ disabled: currentPage === 1 }"
      @click="goPage(currentPage - 1)"
    >
      ←
    </button>
    <template v-for="n in pageNumbers" :key="n">
      <span
        v-if="n === '…'"
        class="text-fg-subtle px-1 font-mono text-[0.78rem]"
        >…</span
      >
      <button
        v-else
        class="page-btn"
        :class="{ active: n === currentPage }"
        @click="goPage(n as number)"
      >
        {{ n }}
      </button>
    </template>
    <button
      class="page-btn"
      :class="{ disabled: currentPage === totalPages }"
      @click="goPage(currentPage + 1)"
    >
      →
    </button>
  </div>
  <div v-else class="mb-24"></div>
</template>

<style>
@reference "../style.css";

.filter-btn.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-dim);
}

.page-btn {
  @apply border-line text-fg-muted hover:border-accent hover:text-accent flex h-9 w-9 cursor-pointer items-center justify-center rounded-xs border bg-transparent font-mono text-[0.78rem] transition-all;
}

.page-btn.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-dim);
}

.page-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
