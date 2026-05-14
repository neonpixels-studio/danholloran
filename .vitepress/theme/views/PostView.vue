<script setup lang="ts">
import { computed } from "vue";
import { Post } from "@typedefs";
import resume from "@data/resume.ts";

const { post, posts } = defineProps<{
  post: Post;
  posts: Post[];
}>();

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
        class="text-accent bg-accent-dim rounded-xs px-2.5 py-1 font-mono text-[0.65rem] font-semibold tracking-[0.08em] uppercase"
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
        class="h-full w-full"
        :alt="`${post.frontmatter.title} image`"
      />
    </div>

    <article
      class="post-body text-fg text-base leading-[1.85]"
      v-html="post.html"
    ></article>

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

    <nav
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
</template>
