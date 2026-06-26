<script setup lang="ts">
defineProps<{ modelValue: "dark" | "light" }>();
defineEmits<{ "update:modelValue": ["dark" | "light"] }>();
</script>

<template>
  <div class="gc-toggle" role="group" aria-label="Preview variant">
    <button
      type="button"
      class="gc-toggle-btn"
      :class="{ 'is-active': modelValue === 'dark' }"
      :aria-pressed="modelValue === 'dark'"
      @click="$emit('update:modelValue', 'dark')"
    >
      <span class="gc-swatch-dot" style="background: #83afe5"></span>
      Dark
    </button>
    <button
      type="button"
      class="gc-toggle-btn"
      :class="{ 'is-active': modelValue === 'light' }"
      :aria-pressed="modelValue === 'light'"
      @click="$emit('update:modelValue', 'light')"
    >
      <span class="gc-swatch-dot" style="background: #4a80c8"></span>
      Light
    </button>
  </div>
</template>

<style scoped>
.gc-toggle {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: transparent;
  gap: 2px;
}
.gc-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}
.gc-toggle-btn:hover {
  color: var(--color-fg);
}
.gc-toggle-btn.is-active {
  background: var(--color-accent);
  color: #fff;
}
.gc-swatch-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
</style>
