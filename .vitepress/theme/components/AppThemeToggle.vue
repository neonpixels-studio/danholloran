<script setup lang="ts">
import { useAppearance } from "@composables/useAppearance.ts";

const { theme, themeIcon, cycleTheme } = useAppearance();
</script>

<template>
  <button
    type="button"
    :aria-label="`Color theme: ${theme}`"
    :title="`Color theme: ${theme}`"
    class="text-fg-subtle hover:text-accent inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-2 transition-colors"
    @click="cycleTheme"
  >
    <svg
      v-if="themeIcon === 'monitor'"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="2" width="14" height="10" rx="1.5" />
      <path d="M5 14h6M8 12v2" />
    </svg>

    <svg
      v-else-if="themeIcon === 'sun'"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="2.5" />
      <path
        d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1"
      />
    </svg>

    <svg
      v-else
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z" />
    </svg>
  </button>
</template>
