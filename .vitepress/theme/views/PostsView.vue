<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { Post } from "@typedefs";
import NewsletterBanner from "@components/NewsletterBanner.vue";
import {
  ALL_TOPIC,
  ALL_TAG,
  POSTS_INDEX,
  archiveHref,
  hasFilterRoute,
  pageSlice,
  pickRepresentativeLabel,
  toFilterSlug,
  toPageNumber,
  totalPagesForCount,
} from "@utils/archive";

// The archive is driven entirely by route params, not client state: each
// paginated / filtered page is a real, statically generated route (see
// posts/page, posts/topic, posts/tag) so the whole archive is crawlable and
// works with JS off. `topic`/`tag` are filter *slugs* (matched against
// toFilterSlug of each post's value); `tagLabel` is the human label shown in
// the active-tag chip. Navigation is plain <a href> links — VitePress upgrades
// them to instant client-side transitions when JS is available.
const {
  posts,
  topic = ALL_TOPIC,
  tag = ALL_TAG,
  tagLabel = "",
  page = 1,
} = defineProps<{
  posts: Post[];
  topic?: string;
  tag?: string;
  tagLabel?: string;
  page?: number;
}>();

const FIRST_PAGE = 1;
const PAGE_WINDOW = 1;
const ELLIPSIS = "…";

// Guard against a missing / malformed page param (Number(undefined) === NaN),
// which would otherwise slice out an empty, thin archive page.
const currentPage = computed(() => toPageNumber(page));

const activeTopicSlug = computed(() => (topic === ALL_TOPIC ? null : topic));
const activeTagSlug = computed(() => (tag === ALL_TAG ? null : tag));

const filterContext = computed(() => ({
  topicSlug: activeTopicSlug.value,
  tagSlug: activeTagSlug.value,
}));

function tagsOf(post: Post): string[] {
  return Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags : [];
}

// De-duped by slug (not label) and stripped of route-less labels, so the row
// never renders two chips pointing at one route or a dead /posts/topic/ link.
const topicEntries = computed(() => {
  const bySlug = new Map<string, string>();
  for (const label of posts.map((post) => post.frontmatter.topic)) {
    registerTopic(bySlug, label);
  }
  return [...bySlug.entries()]
    .map(([slug, label]) => ({ slug, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
});

function registerTopic(bySlug: Map<string, string>, label: string): void {
  if (!hasFilterRoute(label)) {
    return;
  }
  const slug = toFilterSlug(label);
  bySlug.set(slug, pickRepresentativeLabel(bySlug.get(slug), label));
}

function matchesTopic(post: Post): boolean {
  if (activeTopicSlug.value === null) {
    return true;
  }
  return toFilterSlug(post.frontmatter.topic) === activeTopicSlug.value;
}

function matchesTag(post: Post): boolean {
  if (activeTagSlug.value === null) {
    return true;
  }
  return tagsOf(post).some(
    (postTag) => toFilterSlug(postTag) === activeTagSlug.value,
  );
}

const filtered = computed(() =>
  posts.filter((post) => matchesTopic(post) && matchesTag(post)),
);

const totalPages = computed(() => totalPagesForCount(filtered.value.length));
const pagePosts = computed(() => pageSlice(filtered.value, currentPage.value));

// A per-filter heading so each topic/tag page is a distinct indexable surface
// rather than repeating the blog index's H1. Null keeps the default two-line
// hero on the unfiltered archive (including its paginated pages).
const activeTopicLabel = computed(
  () =>
    topicEntries.value.find((entry) => entry.slug === activeTopicSlug.value)
      ?.label ?? "",
);

const pageSuffix = computed(() =>
  currentPage.value > FIRST_PAGE ? ` — Page ${currentPage.value}` : "",
);

const pageHeading = computed(() => {
  if (activeTopicSlug.value !== null) {
    return `Posts on ${activeTopicLabel.value || topic}${pageSuffix.value}`;
  }
  if (activeTagSlug.value !== null) {
    return `Posts tagged #${tagLabel || tag}${pageSuffix.value}`;
  }
  // Unfiltered page 1 keeps the two-line hero; later pages get a distinct H1.
  if (currentPage.value > FIRST_PAGE) {
    return `Writing${pageSuffix.value}`;
  }
  return null;
});

// The featured full-width lead card only renders on page 1 of a filter.
function isFeatured(index: number): boolean {
  return currentPage.value === FIRST_PAGE && index === 0;
}

function topicHref(slug: string): string {
  return archiveHref(FIRST_PAGE, { topicSlug: slug });
}

function pageHref(targetPage: number): string {
  return archiveHref(targetPage, filterContext.value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type PaginationItem =
  | { kind: "gap"; key: string }
  | { kind: "page"; key: string; page: number; href: string; active: boolean };

function isWindowed(pageNumber: number): boolean {
  if (pageNumber === FIRST_PAGE || pageNumber === totalPages.value) {
    return true;
  }
  return Math.abs(pageNumber - currentPage.value) <= PAGE_WINDOW;
}

function toPaginationItem(pageNumber: number): PaginationItem | null {
  if (isWindowed(pageNumber)) {
    return {
      kind: "page",
      key: String(pageNumber),
      page: pageNumber,
      href: pageHref(pageNumber),
      active: pageNumber === currentPage.value,
    };
  }
  if (Math.abs(pageNumber - currentPage.value) === PAGE_WINDOW + 1) {
    return { kind: "gap", key: `${ELLIPSIS}${pageNumber}` };
  }
  return null;
}

const paginationItems = computed<PaginationItem[]>(() => {
  const items: PaginationItem[] = [];
  for (
    let pageNumber = FIRST_PAGE;
    pageNumber <= totalPages.value;
    pageNumber += 1
  ) {
    const item = toPaginationItem(pageNumber);
    if (item) {
      items.push(item);
    }
  }
  return items;
});

const hasPrev = computed(() => currentPage.value > FIRST_PAGE);
const hasNext = computed(() => currentPage.value < totalPages.value);
const prevHref = computed(() => pageHref(currentPage.value - 1));
const nextHref = computed(() => pageHref(currentPage.value + 1));

let fadeObserver: IntersectionObserver | null = null;

onMounted(() => {
  fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("visible");
        fadeObserver?.unobserve(entry.target);
      });
    },
    { threshold: 0.1 },
  );
  document
    .querySelectorAll(".fade-in:not(.visible)")
    .forEach((element) => fadeObserver?.observe(element));
});

onUnmounted(() => {
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
      v-if="pageHeading"
      class="mb-4 font-mono leading-[1.1] font-bold"
      style="font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -0.04em"
    >
      {{ pageHeading }}
    </h1>
    <h1
      v-else
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

  <nav
    v-if="topicEntries.length > 1"
    aria-label="Filter posts by topic"
    class="fade-in mx-auto mb-4 flex max-w-275 flex-wrap items-center gap-2 px-8"
  >
    <span class="text-fg-subtle font-mono text-[0.72rem] lowercase"
      >topic:</span
    >
    <a
      :href="POSTS_INDEX"
      class="filter-btn border-line text-fg-muted hover:border-accent hover:text-accent inline-flex items-center gap-1.5 rounded-xs border bg-transparent px-3 py-1.5 font-mono text-[0.72rem] tracking-[0.02em] lowercase no-underline transition-all"
      :class="{ active: activeTopicSlug === null && activeTagSlug === null }"
    >
      {{ ALL_TOPIC }}
    </a>
    <a
      v-for="entry in topicEntries"
      :key="entry.slug"
      :href="
        activeTopicSlug === entry.slug ? POSTS_INDEX : topicHref(entry.slug)
      "
      class="filter-btn border-line text-fg-muted hover:border-accent hover:text-accent inline-flex items-center gap-1.5 rounded-xs border bg-transparent px-3 py-1.5 font-mono text-[0.72rem] tracking-[0.02em] lowercase no-underline transition-all"
      :class="{ active: activeTopicSlug === entry.slug }"
    >
      {{ entry.label
      }}<span v-if="activeTopicSlug === entry.slug" aria-hidden="true">×</span>
    </a>
  </nav>

  <div
    v-if="activeTagSlug !== null"
    class="fade-in mx-auto mb-12 flex max-w-275 flex-wrap items-center gap-2 px-8"
  >
    <span class="text-fg-subtle font-mono text-[0.72rem] lowercase">tag:</span>
    <a
      :href="POSTS_INDEX"
      class="filter-btn border-line text-fg-muted hover:border-accent hover:text-accent active inline-flex items-center gap-1.5 rounded-xs border bg-transparent px-3 py-1.5 font-mono text-[0.72rem] tracking-[0.02em] lowercase no-underline transition-all"
    >
      #{{ tagLabel || tag }} <span aria-hidden="true">×</span>
    </a>
  </div>

  <div
    v-if="filtered.length === 0"
    class="mx-auto max-w-275 px-8 pt-8 pb-24 text-center"
  >
    <p class="text-fg-muted font-mono text-[0.9rem]">
      No posts found for the current filters.
    </p>
    <a
      :href="POSTS_INDEX"
      class="text-accent mt-4 inline-block bg-transparent font-mono text-[0.8rem] underline"
    >
      clear all filters
    </a>
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
      :class="{ 'col-span-full flex-row! max-md:flex-col!': isFeatured(i) }"
      :style="`transition-delay:${i * 60}ms`"
    >
      <div
        class="aspect-video shrink-0 overflow-hidden bg-[#e8e6e1]"
        :class="
          isFeatured(i)
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
            class="text-on-accent-dim bg-accent-dim rounded-xs px-2 py-0.5 font-mono text-[0.62rem] font-semibold tracking-[0.08em] uppercase"
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
          :class="isFeatured(i) ? 'text-[1.4rem]' : 'text-[1.05rem]'"
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

  <nav
    v-if="totalPages > 1"
    aria-label="Archive pagination"
    class="mx-auto mt-16 mb-24 flex max-w-275 items-center justify-center gap-2 px-8"
  >
    <a
      v-if="hasPrev"
      :href="prevHref"
      class="page-btn"
      aria-label="Previous page"
      >←</a
    >
    <span v-else class="page-btn disabled" aria-hidden="true">←</span>
    <template v-for="item in paginationItems" :key="item.key">
      <span
        v-if="item.kind === 'gap'"
        class="text-fg-subtle px-1 font-mono text-[0.78rem]"
        >{{ ELLIPSIS }}</span
      >
      <span
        v-else-if="item.active"
        class="page-btn active"
        aria-current="page"
        >{{ item.page }}</span
      >
      <a v-else :href="item.href" class="page-btn">{{ item.page }}</a>
    </template>
    <a v-if="hasNext" :href="nextHref" class="page-btn" aria-label="Next page"
      >→</a
    >
    <span v-else class="page-btn disabled" aria-hidden="true">→</span>
  </nav>
  <div v-else class="mb-12"></div>

  <!-- NEWSLETTER · featured slim block -->
  <NewsletterBanner />
</template>

<style>
@reference "../style.css";

.filter-btn.active {
  border-color: var(--color-accent);
  /* on-accent-dim clears AA on the tinted fill; plain accent only hits ~4:1. */
  color: var(--color-on-accent-dim);
  background: var(--color-accent-dim);
}

.page-btn {
  @apply border-line text-fg-muted hover:border-accent hover:text-accent flex h-9 w-9 cursor-pointer items-center justify-center rounded-xs border bg-transparent font-mono text-[0.78rem] no-underline transition-all;
}

.page-btn.active {
  border-color: var(--color-accent);
  color: var(--color-on-accent-dim);
  background: var(--color-accent-dim);
}

.page-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
