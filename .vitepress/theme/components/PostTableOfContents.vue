<script setup lang="ts">
import { computed } from "vue";

import { tocSections, type PostHeader } from "@utils/postHeaders";

const { headers = [] } = defineProps<{
  headers?: PostHeader[];
}>();

const sections = computed(() => tocSections(headers));
</script>

<template>
  <nav
    v-if="sections.length"
    aria-label="Table of contents"
    class="border-line mb-12 rounded border p-5"
    data-testid="post-table-of-contents"
  >
    <p
      class="text-fg-subtle mb-3 font-mono text-[0.65rem] font-semibold tracking-[0.08em] uppercase"
    >
      On this page
    </p>
    <ul class="m-0 flex list-none flex-col gap-2 p-0">
      <li v-for="section in sections" :key="section.link">
        <a
          :href="section.link"
          class="text-fg-muted hover:text-accent font-mono text-[0.8rem] leading-[1.5] no-underline transition-colors"
          >{{ section.title }}</a
        >
      </li>
    </ul>
  </nav>
</template>
