<script setup lang="ts">
import { ref } from "vue";

const isDark = ref(
  typeof document === "undefined"
    ? false
    : document.documentElement.classList.contains("dark"),
);

function updateThemeColor(dark: boolean) {
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]:not([media])',
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = dark ? "#0e0e10" : "#fafaf9";
}

function toggle() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
  updateThemeColor(isDark.value);
}
</script>

<template>
  <button
    type="button"
    aria-label="Toggle theme"
    title="Toggle theme"
    class="text-fg-subtle hover:text-accent inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-2 transition-colors"
    @click="toggle"
  >
    <svg
      v-if="!isDark"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    >
      <circle cx="8" cy="8" r="3" />
      <path
        d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.7 2.7l1.1 1.1M12.2 12.2l1.1 1.1M2.7 13.3l1.1-1.1M12.2 3.8l1.1-1.1"
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
      stroke-linejoin="round"
    >
      <path d="M13 9.5A5.5 5.5 0 1 1 6.5 3a4.5 4.5 0 0 0 6.5 6.5z" />
    </svg>
  </button>
</template>
