<script setup lang="ts">
import projects from "@data/projects";
</script>

<template>
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
</template>
