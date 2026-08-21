<script setup lang="ts">
import { data as instagramPosts } from "@content/instagram/instagram.data.ts";
import socialLinks from "@data/socialLinks.ts";
import { formatPostDate } from "@utils/formatDate";

const instagramHandle = socialLinks.INSTAGRAM.match(
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)/,
)?.[1];
</script>

<template>
  <section id="instagram" class="bg-bg-soft border-line border-t px-8 py-20">
    <div class="mx-auto max-w-[1100px]">
      <div class="accent-line in mb-6"></div>
      <div class="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div
            class="reveal text-fg-subtle in mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-widest uppercase"
          >
            <span class="bg-accent inline-block h-px w-6"></span>
            off-screen
          </div>
          <h2
            class="reveal in mb-2 font-mono leading-none font-bold"
            style="
              font-size: clamp(1.6rem, 3vw, 2.2rem);
              letter-spacing: var(--tracking-tightest);
            "
          >
            From the Feed
          </h2>
          <p
            class="reveal text-fg-muted in max-w-110 font-mono text-[0.72rem] leading-[1.7]"
          >
            A visual sketchbook — photography, travel, and the occasional
            sparkle. Updated whenever the light is right.
          </p>
        </div>
        <a
          :href="socialLinks.INSTAGRAM"
          target="_blank"
          rel="noopener"
          class="reveal group text-accent border-accent/40 hover:bg-accent hover:border-accent in inline-flex items-center gap-2 rounded-xs border px-3 py-2 font-mono text-[0.72rem] tracking-[0.02em] no-underline transition-all hover:text-white"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <rect x="1.5" y="1.5" width="13" height="13" rx="3.5"></rect>
            <circle cx="8" cy="8" r="3.2"></circle>
            <circle
              cx="11.8"
              cy="4.2"
              r="0.7"
              fill="currentColor"
              stroke="none"
            ></circle>
          </svg>
          @{{ instagramHandle }}
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            class="transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            <path
              d="M2 6H10M10 6L6.5 2.5M10 6L6.5 9.5"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </a>
      </div>

      <div
        class="stagger in grid grid-cols-6 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2"
      >
        <a
          v-for="(post, index) in instagramPosts.slice(0, 6)"
          :key="post.frontmatter.url"
          :href="post.frontmatter.url"
          target="_blank"
          rel="noopener"
          class="ig-tile group border-line hover:border-accent relative block aspect-square overflow-hidden rounded-xs border transition-colors duration-200"
        >
          <div
            class="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
          >
            <img
              :src="`${post.frontmatter.images[Math.floor(Math.random() * post.frontmatter.images.length)]}`"
              :alt="
                post.frontmatter.caption ||
                `${post.frontmatter.location} image` ||
                `Instagram Post ${index}`
              "
              width="480"
              height="480"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div
            class="absolute inset-0 flex flex-col justify-between bg-linear-to-b from-transparent via-transparent to-black/55 p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <span
              class="self-end font-mono text-[0.55rem] tracking-[0.08em] text-white/90 uppercase"
            >
              {{ ((index as number) + 1).toString().padStart(2, "0") }}
            </span>
            <div
              class="flex items-center gap-1 font-mono text-[0.6rem] text-white"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M8 14s-6-3.5-6-8a4 4 0 0 1 7-2.7A4 4 0 0 1 14 6c0 4.5-6 8-6 8z"
                ></path>
              </svg>
              <span>view</span>
            </div>
          </div>
          <span
            class="text-fg-subtle bg-bg/80 absolute top-2 left-2 rounded-xs px-1.5 py-0.5 font-mono text-[0.55rem] tracking-[0.08em] uppercase backdrop-blur-sm"
            >photo</span
          >
        </a>
      </div>

      <div
        class="reveal text-fg-subtle in mt-8 flex flex-wrap items-center justify-between gap-3 font-mono text-[0.62rem] tracking-[0.08em] uppercase"
      >
        <span>// 🦄 snapshots between commits</span>
        <span class="inline-flex items-center gap-2">
          <span
            class="live-dot inline-block h-1.5 w-1.5 rounded-full bg-green-500"
          >
          </span>

          Updated {{ formatPostDate(instagramPosts[0].frontmatter.created_at) }}
        </span>
      </div>
    </div>
  </section>
</template>
