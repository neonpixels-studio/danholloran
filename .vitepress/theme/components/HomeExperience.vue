<script setup lang="ts">
import resume from "@data/resume";
import type { SkillInterface } from "@typedefs";
import { formatPeriod } from "@utils/formatDate";

interface TimelineEntry {
  title: string;
  subtitle: string;
  location: string;
  start: Date;
  end: Date | null | undefined;
  skills: SkillInterface[];
}

// Experience and education entries have different shapes (role/company vs.
// degree/field/school); normalize both into one display shape up front so
// the template doesn't need to branch on which kind of entry it's rendering.
const experience: TimelineEntry[] = [
  ...resume.experience.map((entry): TimelineEntry => ({
    title: entry.role,
    subtitle: entry.company,
    location: entry.location,
    start: entry.start,
    end: entry.end,
    skills: entry.skills,
  })),
  ...resume.education.map((entry): TimelineEntry => ({
    title: `${entry.degree} in ${entry.field}`,
    subtitle: entry.school,
    location: entry.location,
    start: entry.start,
    end: entry.end,
    skills: entry.skills,
  })),
].sort((a, b) => b.start.getTime() - a.start.getTime());
</script>

<template>
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
              aria-hidden="true"
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
            :key="job.title + job.subtitle"
            class="grid grid-cols-[1fr_auto] gap-4 py-5"
            :class="index < experience.length - 1 ? 'border-line border-b' : ''"
          >
            <div>
              <div class="mb-1.5 flex flex-wrap items-center gap-2.5">
                <span
                  class="tracking-tighter-2 font-mono text-[0.9rem] leading-snug font-bold"
                  >{{ job.title }}</span
                >
                <span
                  v-if="job.end == null"
                  class="text-on-accent-dim bg-accent-dim rounded-xs px-1.5 py-px font-mono text-[0.58rem]"
                >
                  current
                </span>
              </div>
              <div class="text-fg-muted mb-2.5 font-mono text-[0.72rem]">
                @{{ job.subtitle }} · {{ job.location }}
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
</template>
