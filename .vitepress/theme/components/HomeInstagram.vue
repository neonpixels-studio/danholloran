<script setup lang="ts">
import { data as instagramPosts } from "@content/instagram/instagram.data.ts";
import socialLinks from "@data/socialLinks.ts";
import { formatPostDate } from "@utils/formatDate";

const instagramHandle = socialLinks.INSTAGRAM.match(
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)/,
)?.[1];
</script>

<template>
  <section
    id="instagram"
    class="bg-bg-soft border-line border-t px-8 py-20"
    data-om-id="7734590d:287"
  >
    <div class="mx-auto max-w-[1100px]" data-om-id="7734590d:288">
      <div class="accent-line in mb-6" data-om-id="7734590d:289"></div>
      <div
        class="mb-10 flex flex-wrap items-end justify-between gap-4"
        data-om-id="7734590d:290"
      >
        <div data-om-id="7734590d:291">
          <div
            class="reveal text-fg-subtle in mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-widest uppercase"
            data-om-id="7734590d:292"
          >
            <span
              class="bg-accent inline-block h-px w-6"
              data-om-id="7734590d:293"
            ></span>
            off-screen
          </div>
          <h2
            class="reveal in mb-2 font-mono leading-none font-bold"
            style="
              font-size: clamp(1.6rem, 3vw, 2.2rem);
              letter-spacing: var(--tracking-tightest);
            "
            data-om-id="7734590d:294"
          >
            From the Feed
          </h2>
          <p
            class="reveal text-fg-muted in max-w-110 font-mono text-[0.72rem] leading-[1.7]"
            data-om-id="7734590d:295"
          >
            A visual sketchbook — photography, travel, and the occasional
            sparkle. Updated whenever the light is right.
          </p>
        </div>
        <a
          :href="socialLinks.INSTAGRAM"
          target="blank"
          rel="noopener"
          class="reveal group text-accent border-accent/40 hover:bg-accent hover:border-accent in inline-flex items-center gap-2 rounded-xs border px-3 py-2 font-mono text-[0.72rem] tracking-[0.02em] no-underline transition-all hover:text-white"
          data-om-id="7734590d:296"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
            data-om-id="7734590d:297"
          >
            <rect
              x="1.5"
              y="1.5"
              width="13"
              height="13"
              rx="3.5"
              data-om-id="7734590d:298"
            ></rect>
            <circle cx="8" cy="8" r="3.2" data-om-id="7734590d:299"></circle>
            <circle
              cx="11.8"
              cy="4.2"
              r="0.7"
              fill="currentColor"
              stroke="none"
              data-om-id="7734590d:300"
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
            data-om-id="7734590d:301"
          >
            <path
              d="M2 6H10M10 6L6.5 2.5M10 6L6.5 9.5"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
              stroke-linejoin="round"
              data-om-id="7734590d:302"
            ></path>
          </svg>
        </a>
      </div>

      <div
        class="stagger in grid grid-cols-6 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2"
        data-om-id="7734590d:303"
      >
        <a
          v-for="(post, index) in instagramPosts.slice(0, 6)"
          :key="post.frontmatter.url"
          :href="post.frontmatter.url"
          target="blank"
          rel="noopener"
          class="ig-tile group border-line hover:border-accent relative block aspect-square overflow-hidden rounded-xs border transition-colors duration-200"
          data-om-id="7734590d:304"
        >
          <div
            class="absolute inset-0 bg-red-500 transition-transform duration-500 group-hover:scale-[1.04]"
            data-om-id="7734590d:305"
          >
            <img
              :src="`${post.frontmatter.images[Math.floor(Math.random() * post.frontmatter.images.length)]}`"
              :alt="post.frontmatter.caption || `Instagram Post ${index}`"
            />
          </div>
          <div
            class="absolute inset-0 flex flex-col justify-between bg-linear-to-b from-transparent via-transparent to-black/55 p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            data-om-id="7734590d:306"
          >
            <span
              class="self-end font-mono text-[0.55rem] tracking-[0.08em] text-white/90 uppercase"
              data-om-id="7734590d:307"
            >
              {{ ((index as number) + 1).toString().padStart(2, "0") }}
            </span>
            <div
              class="flex items-center gap-1 font-mono text-[0.6rem] text-white"
              data-om-id="7734590d:308"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
                data-om-id="7734590d:309"
              >
                <path
                  d="M8 14s-6-3.5-6-8a4 4 0 0 1 7-2.7A4 4 0 0 1 14 6c0 4.5-6 8-6 8z"
                  data-om-id="7734590d:310"
                ></path>
              </svg>
              <span data-om-id="7734590d:311">view</span>
            </div>
          </div>
          <span
            class="text-fg-subtle bg-bg/80 absolute top-2 left-2 rounded-xs px-1.5 py-0.5 font-mono text-[0.55rem] tracking-[0.08em] uppercase backdrop-blur-sm"
            data-om-id="7734590d:312"
            >photo</span
          >
        </a>
      </div>

      <div
        class="reveal text-fg-subtle in mt-8 flex flex-wrap items-center justify-between gap-3 font-mono text-[0.62rem] tracking-[0.08em] uppercase"
        data-om-id="7734590d:369"
      >
        <span data-om-id="7734590d:370">// 🦄 snapshots between commits</span>
        <span class="inline-flex items-center gap-2" data-om-id="7734590d:371">
          <span
            class="live-dot inline-block h-1.5 w-1.5 rounded-full bg-green-500"
            data-om-id="7734590d:372"
          >
          </span>

          Updated {{ formatPostDate(instagramPosts[0].frontmatter.created_at) }}
        </span>
      </div>
    </div>
  </section>
</template>
