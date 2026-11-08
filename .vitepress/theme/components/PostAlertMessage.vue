<script setup lang="ts">
defineProps<{
  message?: string;
}>();
</script>

<template>
  <aside
    v-if="message"
    class="border-accent bg-accent-dim text-fg mb-8 flex gap-3.5 rounded border-l-2 p-5"
    role="note"
    aria-label="Notice"
    data-testid="post-alert-message"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      class="text-on-accent-dim mt-0.5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="7.25" />
      <path d="M9 5.5v4.5" stroke-linecap="round" />
      <circle cx="9" cy="12.6" r="0.55" fill="currentColor" stroke="none" />
    </svg>
    <p class="m-0 font-mono text-[0.8rem] leading-[1.7] font-semibold">
      {{ message }}
    </p>
  </aside>
</template>
