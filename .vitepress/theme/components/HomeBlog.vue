<script setup lang="ts">
import { data as posts } from "@content/posts/posts.data.ts";
import { formatPostDate } from "@utils/formatDate";

const featuredPost = posts[0];
const recentPosts = posts.slice(1, 9);
</script>

<template>
  <section id="blog" class="px-8 py-20">
    <div class="mx-auto max-w-275">
      <div class="accent-line mb-6"></div>
      <div class="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h2
          class="reveal font-mono font-bold"
          style="
            font-size: clamp(1.6rem, 3vw, 2.2rem);
            letter-spacing: var(--tracking-tightest);
          "
        >
          Latest Posts
        </h2>
        <span class="reveal text-fg-subtle font-mono text-[0.68rem]">
          <a href="/posts/" class="text-accent no-underline">all posts →</a>
        </span>
      </div>

      <a
        v-if="featuredPost"
        :href="featuredPost.url"
        class="reveal border-line text-fg hover:border-accent mb-6 grid grid-cols-2 gap-0 overflow-hidden rounded border no-underline transition-colors duration-200 max-md:grid-cols-1"
      >
        <img
          :src="featuredPost.frontmatter.image"
          class="min-h-60 object-cover"
          :alt="`${featuredPost.frontmatter.title} thumbnail`"
        />
        <div class="flex flex-col justify-center p-8">
          <div class="flex flex-wrap items-center gap-2">
            <span class="blog-tag-pill">{{
              featuredPost.frontmatter.topic
            }}</span>
            <span class="text-fg-subtle font-mono text-[0.65rem]"
              >{{ formatPostDate(featuredPost.frontmatter.date) }} ·
              {{ featuredPost.frontmatter.readTime }} min</span
            >
          </div>
          <div
            class="my-3 font-mono text-[1.2rem] leading-[1.3] font-bold tracking-[-0.03em]"
          >
            {{ featuredPost.frontmatter.title }}
          </div>
          <span class="text-accent font-mono text-[0.72rem]">read more →</span>
        </div>
      </a>

      <div
        class="stagger grid gap-4"
        style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))"
      >
        <a
          v-for="post in recentPosts"
          :key="post.frontmatter.slug"
          :href="post.url"
          class="border-line text-fg hover:border-accent block rounded border p-5 no-underline transition-[border-color,transform] duration-200 hover:-translate-y-0.5"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="blog-tag-pill">{{ post.frontmatter.topic }}</span>
            <span class="text-fg-subtle font-mono text-[0.65rem]">{{
              formatPostDate(post.frontmatter.date)
            }}</span>
          </div>
          <div
            class="mt-2.5 mb-2 font-mono text-[0.85rem] leading-[1.35] font-semibold"
          >
            {{ post.frontmatter.title }}
          </div>
          <div class="text-fg-subtle font-mono text-[0.62rem]">
            {{ post.frontmatter.readTime }} min read
          </div>
        </a>
      </div>

      <div class="reveal mt-8 text-center">
        <a
          href="/posts/"
          class="btn-base border-line text-fg hover:border-accent hover:text-accent border"
        >
          view all posts
        </a>
      </div>
    </div>
  </section>
</template>
