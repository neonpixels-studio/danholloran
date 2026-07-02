<script setup lang="ts">
import { computed, ref } from "vue";
import { Post } from "@typedefs";
import resume from "@data/resume.ts";
import NewsletterTerminal from "@components/NewsletterTerminal.vue";
import PostLightbox from "@components/PostLightbox.vue";

const { post, posts } = defineProps<{
  post: Post;
  posts: Post[];
}>();

const lightbox = ref<{ src: string; alt: string } | null>(null);

function openLightbox(src: string, alt: string) {
  lightbox.value = { src, alt };
}

function closeLightbox() {
  lightbox.value = null;
}

function onArticleClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target.tagName !== "IMG" || target.closest("a")) {
    return;
  }
  const image = target as HTMLImageElement;
  openLightbox(image.currentSrc || image.src, image.alt);
}

const postIndex = computed(() =>
  posts.findIndex((p) => p.frontmatter.slug === post.frontmatter.slug),
);

const prevPost = computed(() =>
  postIndex.value < posts.length - 1 ? posts[postIndex.value + 1] : null,
);

const nextPost = computed(() =>
  postIndex.value > 0 ? posts[postIndex.value - 1] : null,
);

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <div v-if="post" class="mx-auto max-w-180 px-8 pt-35 pb-24">
    <a
      href="/posts"
      class="group text-fg-muted hover:text-accent mb-12 inline-flex items-center gap-1.5 font-mono text-[0.75rem] tracking-[0.02em] no-underline transition-colors"
    >
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        class="transition-transform group-hover:-translate-x-1"
      >
        <path
          d="M9 2L4 7L9 12"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      back to blog
    </a>

    <div class="mb-6 flex flex-wrap items-center gap-4">
      <span
        class="text-on-accent-dim bg-accent-dim rounded-xs px-2.5 py-1 font-mono text-[0.65rem] font-semibold tracking-[0.08em] uppercase"
      >
        {{ post.frontmatter.topic }}
      </span>
      <span class="text-fg-subtle font-mono text-[0.72rem]">{{
        formatDate(post.frontmatter.date)
      }}</span>
      <span class="text-fg-subtle font-mono text-[0.72rem]">
        · {{ post.frontmatter.readTime }} min read
      </span>
    </div>

    <h1
      class="mb-6 font-mono leading-[1.2] font-bold"
      style="font-size: clamp(1.8rem, 4vw, 2.6rem); letter-spacing: -0.04em"
    >
      {{ post.frontmatter.title }}
    </h1>

    <p
      class="text-fg-muted border-accent mb-8 border-l-2 pl-5 text-[1.1rem] leading-[1.7]"
    >
      {{ post.frontmatter.description }}
    </p>

    <div
      class="border-line mb-12 flex items-center gap-4 border-t border-b py-5"
    >
      <div
        class="bg-accent-dim border-accent h-10 w-10 shrink-0 overflow-hidden rounded-full border-2"
      >
        <img
          :src="resume.photo"
          alt="Dan Holloran"
          class="h-full w-full object-cover"
        />
      </div>
      <div class="flex-1">
        <div class="font-mono text-[0.8rem] font-semibold">Dan Holloran</div>
        <div class="text-fg-subtle font-mono text-[0.7rem]">
          {{ resume.headline }}
        </div>
      </div>
    </div>

    <div class="mb-12 aspect-video w-full overflow-hidden rounded bg-[#e8e6e1]">
      <img
        :src="post.frontmatter.image"
        class="h-full w-full cursor-zoom-in"
        :alt="post.frontmatter.title"
        @click="openLightbox(post.frontmatter.image, post.frontmatter.title)"
      />
    </div>

    <article
      class="post-body text-fg text-base leading-[1.85]"
      @click="onArticleClick"
      v-html="post.html"
    ></article>

    <!-- DISCLAIMER -->
    <aside
      v-if="post.frontmatter.topic === 'finance'"
      class="border-line mt-14 flex gap-3.5 rounded border p-5"
      role="note"
      aria-label="Disclaimer"
      data-om-id="fef10f19:123"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        class="text-fg-subtle mt-0.5 shrink-0"
        aria-hidden="true"
        data-om-id="fef10f19:124"
      >
        <circle cx="9" cy="9" r="7.25" data-om-id="fef10f19:125"></circle>
        <path
          d="M9 5.5v4.5"
          stroke-linecap="round"
          data-om-id="fef10f19:126"
        ></path>
        <circle
          cx="9"
          cy="12.6"
          r="0.55"
          fill="currentColor"
          stroke="none"
          data-om-id="fef10f19:127"
        ></circle>
      </svg>
      <p
        class="text-fg-muted m-0 font-mono text-[0.72rem] leading-[1.7]"
        data-om-id="fef10f19:128"
      >
        <strong class="font-semibold" data-om-id="fef10f19:129"
          >Disclaimer:</strong
        >
        This post is for educational and informational purposes only and is not
        financial, investment, or tax advice. Do your own research and consider
        consulting a licensed professional before making financial decisions.
      </p>
    </aside>

    <div class="border-line mt-12 flex flex-wrap gap-2 border-t pt-8">
      <a
        v-for="tag in post.frontmatter.tags"
        :key="tag"
        :href="`/posts?tag=${tag}`"
        class="text-fg-muted border-line tag-hover rounded-xs border px-2.5 py-1 font-mono text-[0.7rem] no-underline transition-colors"
      >
        #{{ tag }}
      </a>
    </div>

    <!-- NEWSLETTER · terminal block -->
    <NewsletterTerminal />

    <nav
      aria-label="Post navigation"
      class="border-line mt-16 grid grid-cols-2 gap-4 border-t pt-8 max-md:grid-cols-1"
    >
      <a
        v-if="prevPost"
        :href="prevPost.url"
        class="border-line hover:border-accent rounded border p-5 no-underline transition-colors"
      >
        <div
          class="text-fg-subtle mb-1.5 font-mono text-[0.65rem] tracking-[0.08em] uppercase"
        >
          ← Previous
        </div>
        <div
          class="text-fg font-mono text-[0.85rem] leading-[1.3] font-semibold"
        >
          {{ prevPost.frontmatter.title }}
        </div>
      </a>
      <div v-else></div>
      <a
        v-if="nextPost"
        :href="nextPost.url"
        class="border-line hover:border-accent rounded border p-5 text-right no-underline transition-colors"
      >
        <div
          class="text-fg-subtle mb-1.5 font-mono text-[0.65rem] tracking-[0.08em] uppercase"
        >
          Next →
        </div>
        <div
          class="text-fg font-mono text-[0.85rem] leading-[1.3] font-semibold"
        >
          {{ nextPost.frontmatter.title }}
        </div>
      </a>
    </nav>
  </div>

  <PostLightbox
    :src="lightbox?.src ?? null"
    :alt="lightbox?.alt"
    @close="closeLightbox"
  />

  <Teleport to="body">
    <div class="progress-bar"></div>
  </Teleport>
</template>

<style>
@reference "../style.css";

.post-body p {
  @apply mb-6;
}

.post-body h2 {
  @apply mt-12 mb-4 font-mono text-[1.4rem] font-bold;
  letter-spacing: -0.03em;
}

.post-body h3 {
  @apply text-fg-muted mt-8 mb-3 font-mono text-[1.1rem] font-semibold;
  letter-spacing: -0.02em;
}

.post-body a {
  @apply text-accent border-accent/30 hover:border-accent border-b no-underline transition-colors;
}

.post-body img {
  cursor: zoom-in;
}

.post-body .lang {
  display: none;
}

.post-body [class*="language-"] {
  position: relative;
}

.post-body [class*="language-"] > button.copy {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  width: 36px;
  height: 36px;
  background-color: var(--color-bg);
  opacity: 0;
  cursor: pointer;
  background-image: var(--icon-copy);
  background-position: 50%;
  background-size: 18px;
  background-repeat: no-repeat;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    opacity 0.2s;
}

.post-body [class*="language-"]:hover > button.copy,
.post-body [class*="language-"] > button.copy:focus {
  opacity: 1;
}

.post-body [class*="language-"] > button.copy:hover,
.post-body [class*="language-"] > button.copy.copied {
  border-color: var(--color-accent);
  background-color: var(--color-accent-dim);
}

.post-body [class*="language-"] > button.copy.copied {
  border-radius: 0 4px 4px 0;
  background-image: var(--icon-copied);
}

.post-body [class*="language-"] > button.copy.copied::before,
.post-body [class*="language-"] > button.copy:hover.copied::before {
  content: "Copied";
  position: absolute;
  right: 100%;
  top: -1px;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-accent);
  border-right: 0;
  border-radius: 4px 0 0 4px;
  padding: 0 10px;
  height: calc(100% + 2px);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-accent);
  background-color: var(--color-accent-dim);
  white-space: nowrap;
}

.post-body blockquote {
  @apply border-accent text-fg-muted my-8 border-l-2 pl-5 italic;
}

.post-body ul,
.post-body ol {
  @apply mb-6 pl-6;
}

.post-body li {
  @apply mb-2;
}

.post-body hr {
  @apply border-line my-12 border-t;
  border-style: solid;
}
</style>
