<script setup lang="ts">
const TRAFFIC_LIGHT_COLORS = ["#dd9787", "#dada93", "#a9ce93"] as const;
</script>

<template>
  <div class="gc-titlebar">
    <span
      v-for="color in TRAFFIC_LIGHT_COLORS"
      :key="color"
      class="gc-dot"
      :style="{ background: color }"
    ></span>
    <slot />
  </div>
</template>

<style scoped>
.gc-titlebar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.95rem;
  background: var(--gc-deep);
  border-bottom: 1px solid var(--gc-border);
  transition: background 0.4s ease;
}
.gc-dot {
  display: inline-block;
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
</style>
