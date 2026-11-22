<script setup lang="ts">
import { useId } from "vue";
import type { PostSeries } from "@typedefs";

const { series = null } = defineProps<{
  series?: PostSeries | null;
}>();

const labelId = useId();

function isCurrentPart(index: number): boolean {
  return series !== null && index + 1 === series.part;
}
</script>

<template>
  <nav
    v-if="series"
    :aria-labelledby="labelId"
    class="border-line mb-12 rounded border p-5"
    data-testid="post-series-nav"
  >
    <p
      :id="labelId"
      class="text-fg-subtle mb-3 font-mono text-[0.65rem] font-semibold tracking-[0.08em] uppercase"
    >
      Part {{ series.part }} of {{ series.total }} ·
      <span class="text-fg">{{ series.name }}</span>
    </p>
    <ol class="m-0 flex list-none flex-col gap-2 p-0">
      <li
        v-for="(entry, index) in series.parts"
        :key="entry.url"
        class="flex gap-2 font-mono text-[0.8rem] leading-normal"
      >
        <span class="text-fg-subtle shrink-0">{{ index + 1 }}.</span>
        <span
          v-if="isCurrentPart(index)"
          aria-current="page"
          class="text-accent font-semibold"
          >{{ entry.title }}</span
        >
        <a
          v-else
          :href="entry.url"
          class="text-fg-muted hover:text-accent no-underline transition-colors"
          >{{ entry.title }}</a
        >
      </li>
    </ol>
  </nav>
</template>
