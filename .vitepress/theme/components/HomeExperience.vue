<script setup lang="ts">
import resume from "@data/resume";

const experience = [...resume.experience, ...resume.education].sort((a, b) => {
  return new Date(b.start).getTime() - new Date(a.start).getTime();
});

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
                  class="text-on-accent-dim bg-accent-dim rounded-xs px-1.5 py-px font-mono text-[0.58rem]"
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
</template>
