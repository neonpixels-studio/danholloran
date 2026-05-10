<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Post } from "@typedefs";
import { useRouter } from "vitepress";

const router = useRouter();

const { allPosts } = defineProps<{
  allPosts: Post[];
}>();

const params = computed<URLSearchParams>(() => {
  if (typeof window === "undefined") {
    return new URLSearchParams("");
  }

  return new URLSearchParams(window.location.search);
});
const ALL_TOPIC = "all";
const topics = [
  ALL_TOPIC,
  ...new Set(allPosts.map((post) => post.frontmatter.topic)),
];
const PER_PAGE = 10;
const currentTopic = ref(params.value.get("topic") ?? ALL_TOPIC);
const currentPage = ref<number>(parseInt(params.value.get("page") ?? "1"));

const filtered = computed(() =>
  currentTopic.value === ALL_TOPIC
    ? allPosts
    : allPosts.filter((p) => p.frontmatter.topic === currentTopic.value),
);

const totalPages = computed(() => Math.ceil(filtered.value.length / PER_PAGE));

const setUrlParams = (topic?: string, page?: number | string) => {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("topic", topic ?? "");
  url.searchParams.set("page", (page ?? "") as string);
  router.go(url.toString());
};

const pagePosts = computed(() => {
  const start = (currentPage.value - 1) * PER_PAGE;
  return filtered.value.slice(start, start + PER_PAGE);
});

function setTopic(f: string) {
  currentTopic.value = f;
  currentPage.value = 1;

  setUrlParams(currentTopic.value, currentPage.value);
}

function goPage(n: number) {
  if (n < 1 || n > totalPages.value) return;
  currentPage.value = n;

  setUrlParams(currentTopic.value, currentPage.value);

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

onMounted(() => {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  document.querySelectorAll(".fade-in").forEach((el) => io.observe(el));
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
    class="fade-in mx-auto mb-12 flex max-w-275 flex-wrap items-center gap-2 px-8"
  >
    <button
      v-for="f in topics"
      :key="f"
      class="filter-btn border-line text-fg-muted hover:border-accent hover:text-accent cursor-pointer rounded-xs border bg-transparent px-3 py-1.5 font-mono text-[0.72rem] tracking-[0.02em] transition-all"
      :class="{ active: currentTopic === f }"
      @click="setTopic(f)"
    >
      {{ f }}
    </button>
  </div>

  <div
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
          currentPage === 1 && i === 0 && currentTopic === 'all',
      }"
      :style="`transition-delay:${i * 60}ms`"
    >
      <div
        class="aspect-video shrink-0 overflow-hidden bg-[#e8e6e1]"
        :class="
          currentPage === 1 && i === 0 && currentTopic === 'all'
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
            currentPage === 1 && i === 0 && currentTopic === 'all'
              ? 'text-[1.4rem]'
              : 'text-[1.05rem]'
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
