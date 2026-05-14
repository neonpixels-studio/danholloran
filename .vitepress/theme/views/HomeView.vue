<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRevealAnimations } from "@composables/useRevealAnimations";
import projects from "@data/projects";
import resume, { CURRENT_LOCATION } from "@data/resume";
import quotes from "@data/quotes";
import { SkillInterface, Post, InstagramPost } from "@typedefs";
import skills from "@data/skills.ts";
import socialLinks from "@data/socialLinks.ts";

const quote = quotes[Math.floor(Math.random() * quotes.length)];

const { posts } = defineProps<{
  posts: Post[];
  instagramPosts: InstagramPost[];
}>();

useRevealAnimations();

const experience = [...resume.experience, ...resume.education].sort((a, b) => {
  return new Date(b.start).getTime() - new Date(a.start).getTime();
});
const featuredPost = posts[0];
const recentPosts = posts.slice(1, 9);

function formatPostDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPeriod(start: string, end: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  return end === null
    ? `${fmt(start)} – Present`
    : `${fmt(start)} – ${fmt(end)}`;
}

const heroParallaxRef = ref<HTMLElement | null>(null);

function onScroll() {
  if (heroParallaxRef.value && window.scrollY < 600) {
    heroParallaxRef.value.style.transform = `translateY(${window.scrollY * 0.08}px)`;
  }
}

const instagramHandle = socialLinks.INSTAGRAM.match(
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)/,
)?.[1];

onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <!-- HERO -->
  <section
    id="about"
    class="border-line bg-topography-edge relative overflow-hidden border-b px-8 pt-35 pb-16"
  >
    <div
      class="relative z-10 container mx-auto grid max-w-275 grid-cols-2 items-center gap-16 max-lg:grid-cols-1"
    >
      <div ref="heroParallaxRef" class="hero-parallax">
        <div
          class="reveal text-fg-subtle mb-8 flex items-center gap-3 font-mono text-[0.68rem] tracking-widest uppercase"
        >
          <span class="bg-accent inline-block h-px w-6"></span>
          <span
            class="live-dot inline-block h-1.5 w-1.5 rounded-full bg-green-500"
          ></span>
          {{ CURRENT_LOCATION }}
        </div>
        <h1
          class="reveal mb-8 font-mono leading-[0.95] font-bold"
          style="
            font-size: clamp(3rem, 6vw, 5rem);
            letter-spacing: var(--tracking-tightest);
          "
        >
          Dan<br /><span class="text-outline inline-block">Holloran</span>
        </h1>
        <p
          class="reveal text-fg-muted mb-10 max-w-110 text-[1.05rem] leading-[1.75]"
        >
          {{ resume.intro }}
        </p>
        <div class="reveal flex flex-wrap gap-3">
          <a
            href="/posts"
            class="btn-base bg-accent border-accent hover:bg-accent-hover hover:border-accent-hover border-2 text-white hover:-translate-y-px"
          >
            read the blog
          </a>
          <a
            href="/#projects"
            class="btn-base border-fg text-fg hover:bg-fg hover:text-bg border-2"
          >
            view projects
          </a>
        </div>
      </div>

      <div class="flex flex-col gap-8">
        <div
          class="reveal-right flex items-center gap-8 max-md:flex-col max-md:items-start"
        >
          <div
            class="border-accent h-25 w-25 shrink-0 overflow-hidden rounded-full border-[3px] shadow-[0_8px_32px_rgba(173,70,255,0.15)]"
          >
            <img
              :src="resume.photo"
              alt="Dan Holloran"
              class="h-full w-full object-cover"
              @error="
                ($event.target as HTMLElement).outerHTML =
                  '<div class=\'w-full h-full bg-accent-dim flex items-center justify-center font-mono text-[1.4rem] text-accent font-bold\'>DH</div>'
              "
            />
          </div>
          <blockquote
            class="text-fg-muted border-accent border-l-2 pl-4 font-mono text-[0.7rem] leading-[1.65] italic"
          >
            "{{ quote.content }}"
            <div class="text-fg-subtle mt-1.5 text-[0.62rem] not-italic">
              — {{ quote.author }}
            </div>
          </blockquote>
        </div>
        <div class="reveal-right">
          <div
            class="text-fg-subtle mb-3 font-mono text-[0.65rem] tracking-[0.08em] uppercase"
          >
            Featured Skills
          </div>
          <div class="stagger flex flex-wrap gap-1.5">
            <span
              v-for="skill in (
                Object.values(skills) as SkillInterface[]
              ).filter((skill) => skill.featured)"
              :key="skill.name"
              class="tag"
            >
              {{ skill.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PROJECTS -->
  <section id="projects" class="px-8 py-20">
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
          Selected Work
        </h2>
        <span class="reveal text-fg-subtle font-mono text-[0.68rem]">
          {{ projects.length.toString().padStart(2, "0") }} projects
        </span>
      </div>
      <div
        class="stagger grid grid-cols-3 gap-6 max-md:grid-cols-2 max-sm:grid-cols-1"
      >
        <div
          v-for="project in projects"
          :key="project.title"
          class="group border-t-2 pt-5 transition-colors duration-300"
          :class="project.featured ? 'border-accent' : 'border-line'"
        >
          <img
            :src="project.image"
            class="mb-4 aspect-video w-full rounded-xs transition-transform duration-400 group-hover:scale-[1.02]"
            :alt="`${project.title} thumbnail`"
          />
          <div
            class="tracking-tighter-2 mb-1 font-mono text-[0.85rem] font-bold"
          >
            {{ project.title }}
          </div>
          <div class="text-fg-subtle mb-2.5 font-mono text-[0.65rem]">
            {{ project.company }}
          </div>
          <div class="mb-2.5 flex flex-wrap gap-1.5">
            <span
              v-for="skill in project.skills"
              :key="skill.name"
              class="tag"
              >{{ skill.name }}</span
            >
          </div>
          <a
            class="text-accent font-mono text-[0.72rem]"
            :href="project.url"
            target="blank"
          >
            view →
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- EXPERIENCE -->
  <section
    id="experience"
    class="bg-bg-soft border-line border-t border-b px-8 py-20"
  >
    <div class="mx-auto max-w-275">
      <div class="accent-line mb-6"></div>
      <div
        class="grid grid-cols-[280px_1fr] items-start gap-16 max-lg:grid-cols-1 max-lg:gap-8"
      >
        <div class="reveal-left">
          <h2
            class="mb-6 font-mono leading-none font-bold"
            style="
              font-size: clamp(1.6rem, 3vw, 2.2rem);
              letter-spacing: var(--tracking-tightest);
            "
          >
            Professional<br />History
          </h2>
          <a
            href="/resume"
            class="group text-accent border-accent/40 hover:bg-accent hover:border-accent inline-flex items-center gap-2 rounded-xs border px-3 py-2 font-mono text-[0.75rem] tracking-[0.02em] no-underline transition-all hover:text-white"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              class="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M2 6H10M10 6L6.5 2.5M10 6L6.5 9.5"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            view full resume
          </a>
        </div>
        <div class="stagger flex flex-col">
          <div
            v-for="(job, index) in experience"
            :key="job.role + (job.company || job.school)"
            class="grid grid-cols-[1fr_auto] gap-4 py-5"
            :class="index < experience.length - 1 ? 'border-line border-b' : ''"
          >
            <div>
              <div class="mb-1.5 flex flex-wrap items-center gap-2.5">
                <span
                  class="tracking-tighter-2 font-mono text-[0.9rem] leading-snug font-bold"
                  >{{ job.role || `${job.degree} in ${job.field}` }}</span
                >
                <span
                  v-if="job.end === null"
                  class="text-accent bg-accent-dim rounded-xs px-1.5 py-px font-mono text-[0.58rem]"
                >
                  current
                </span>
              </div>
              <div class="text-fg-muted mb-2.5 font-mono text-[0.72rem]">
                @{{ job.company || job.school }} · {{ job.location }}
              </div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="skill in job.skills"
                  :key="skill.name"
                  class="tag"
                  >{{ skill.name }}</span
                >
              </div>
            </div>
            <div
              class="text-fg-subtle text-right font-mono text-[0.68rem] whitespace-nowrap"
            >
              {{ formatPeriod(job.start, job.end) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- BLOG -->
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
          <a href="/posts" class="text-accent no-underline">all posts →</a>
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
          href="/posts"
          class="btn-base border-line text-fg hover:border-accent hover:text-accent border"
        >
          view all posts
        </a>
      </div>
    </div>
  </section>

  <!-- {{ JSON.stringify(instagramPosts, null, 2) }} -->
  <!-- Instagram -->
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
            class="reveal text-fg-subtle in mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.1em] uppercase"
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
              :alt="post.frontmatter.caption"
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
