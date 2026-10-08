<script lang="ts" setup>
import { onMounted } from "vue";
import {
  initAnalyticsConsent,
  useAnalyticsConsent,
} from "@composables/useAnalyticsConsent";

const { bannerVisible, accept, decline } = useAnalyticsConsent();

onMounted(initAnalyticsConsent);
</script>

<template>
  <section
    v-if="bannerVisible"
    aria-labelledby="analytics-consent-title"
    class="border-line bg-bg no-print fixed right-4 bottom-4 left-4 z-[100] flex max-w-md flex-col gap-3 rounded-xs border p-4 shadow-lg sm:left-auto"
  >
    <h2
      id="analytics-consent-title"
      class="text-fg font-mono text-[0.75rem] font-semibold"
    >
      Analytics
    </h2>
    <p class="text-fg-muted text-[0.8rem] leading-normal">
      This site can use Google Analytics to count visits. It stays off unless
      you allow it, and your choice is saved in this browser.
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="btn-base border-accent text-accent hover:bg-accent-dim cursor-pointer border bg-transparent"
        @click="accept"
      >
        Allow
      </button>
      <button
        type="button"
        class="btn-base border-line text-fg-muted hover:text-fg cursor-pointer border bg-transparent"
        @click="decline"
      >
        Decline
      </button>
    </div>
  </section>
</template>
