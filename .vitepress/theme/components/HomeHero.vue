<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import resume, { CURRENT_LOCATION } from "@data/resume";
import quotes from "@data/quotes";
import skills from "@data/skills.ts";
import { SkillInterface } from "@typedefs";

const quote = ref(quotes[0]);
onMounted(() => {
  quote.value = quotes[Math.floor(Math.random() * quotes.length)];
});

const heroParallaxRef = ref<HTMLElement | null>(null);

function onScroll() {
  if (heroParallaxRef.value && window.scrollY < 600) {
    heroParallaxRef.value.style.transform = `translateY(${window.scrollY * 0.08}px)`;
  }
}

onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <section
    id="about"
    class="border-line bg-topography-edge relative overflow-hidden border-b px-8 pt-35 pb-16"
  >
    <div
      class="relative z-10 container mx-auto grid max-w-275 grid-cols-2 items-center gap-16 max-lg:grid-cols-1"
    >
      <div ref="heroParallaxRef" class="hero-parallax">
        <div
          class="reveal in text-fg-subtle mb-8 flex items-center gap-3 font-mono text-[0.68rem] tracking-widest uppercase"
        >
          <span class="bg-accent inline-block h-px w-6"></span>
          <span
            class="live-dot inline-block h-1.5 w-1.5 rounded-full bg-green-500"
          ></span>
          {{ CURRENT_LOCATION }}
        </div>
        <h1
          class="reveal in mb-8 font-mono leading-[0.95] font-bold"
          style="
            font-size: clamp(3rem, 6vw, 5rem);
            letter-spacing: var(--tracking-tightest);
          "
        >
          {{ resume.shortFirstName }}<br /><span
            class="text-outline inline-block"
          >
            {{ resume.lastName }}
          </span>
        </h1>
        <p
          class="reveal in text-fg-muted mb-10 max-w-110 text-[1.05rem] leading-[1.75]"
        >
          {{ resume.intro }}
        </p>
        <div class="reveal in flex flex-wrap gap-3">
          <a
            href="/posts/"
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
</template>
