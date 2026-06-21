<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useMainNav } from "@composables/useMainNav.ts";
import { useNavPanels } from "@composables/useNavPanels.ts";
import socialLinks from "@data/socialLinks";
import AppThemeToggle from "@components/AppThemeToggle.vue";

const { isPathActive, activeSection, navItems } = useMainNav();
const { isMobileMenuOpen, toggleMobileMenu } = useNavPanels();
const isScrolled = ref(false);

function onScroll() {
  isScrolled.value = window.scrollY > 8;

  if (isPathActive("/")) {
    const sections = ["about", "projects", "experience"];
    let active = "";
    for (const id of sections) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (
        r.top < window.innerHeight * 0.4 &&
        r.bottom > window.innerHeight * 0.4
      )
        active = id;
    }
    activeSection.value = active;
  }
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <nav
    id="siteNav"
    class="bg-bg/85 no-print fixed inset-x-0 top-0 z-100 flex h-15 items-center justify-between border-b border-transparent px-8 backdrop-blur-md transition-[border-color,background] duration-300 max-md:px-4"
    :class="{ 'border-line! bg-bg/95!': isScrolled }"
  >
    <a
      href="/"
      class="group text-fg inline-flex items-center gap-2 font-mono text-[0.85rem] font-semibold tracking-[-0.02em] no-underline"
    >
      <svg
        width="22"
        height="16"
        viewBox="0 0 22 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="shrink-0 -translate-y-px transition-transform duration-300 group-hover:-translate-y-0.5"
        aria-hidden="true"
      >
        <path d="M7 14 L13 3 L19 14 Z" fill="#111110" />
        <path
          d="M11.4 6 L13 3 L14.6 6 L13.7 5.6 L13 6.2 L12.3 5.6 Z"
          fill="#ad46ff"
        />
        <path d="M1 14 L7 5.5 L13 14 Z" fill="#ad46ff" />
        <path
          d="M5.6 8 L7 5.5 L8.4 8 L7.6 7.6 L7 8.1 L6.4 7.6 Z"
          fill="#ffffff"
        />
        <path
          d="M0 14.5 H22"
          stroke="#111110"
          stroke-width="0.8"
          stroke-linecap="round"
        />
      </svg>
      <span>dan<span class="text-accent">.</span>holloran</span>
    </a>

    <div class="flex items-center gap-6 max-md:gap-3">
      <a
        v-for="navItem in navItems"
        :key="navItem.link"
        :href="navItem.link"
        class="nav-link text-fg-muted hover:text-accent hidden font-mono text-[0.75rem] tracking-[0.02em] lowercase no-underline transition-colors duration-200 md:block"
        :class="{ 'text-accent!': navItem.isActive() }"
      >
        {{ navItem.label }}
      </a>
    </div>

    <div class="flex items-center gap-2 max-md:gap-1">
      <AppThemeToggle />
      <button
        id="searchToggle"
        type="button"
        aria-label="Search"
        title="Search (⌘K)"
        class="text-fg-subtle hover:text-accent inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-2 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle
            cx="7"
            cy="7"
            r="5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M11 11L14 14"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <a
        :href="socialLinks.GITHUB"
        target="blank"
        rel="noopener"
        aria-label="GitHub"
        class="text-fg-subtle hover:text-accent inline-flex items-center justify-center p-2 transition-colors max-md:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
      </a>
      <a
        :href="socialLinks.INSTAGRAM"
        target="blank"
        rel="noopener"
        aria-label="Instagram"
        class="text-fg-subtle hover:text-accent inline-flex items-center justify-center p-2 transition-colors max-md:hidden"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" />
          <circle cx="8" cy="8" r="3.2" />
          <circle
            cx="11.8"
            cy="4.2"
            r="0.7"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      </a>
      <a
        :href="socialLinks.LINKEDIN"
        target="blank"
        rel="noopener"
        aria-label="LinkedIn"
        class="text-fg-subtle hover:text-accent inline-flex items-center justify-center p-2 transition-colors max-md:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M13.63 13.63h-2.37V9.92c0-.88-.02-2.02-1.23-2.02-1.23 0-1.42.96-1.42 1.96v3.77H6.24V6h2.27v1.04h.03c.32-.6 1.09-1.23 2.24-1.23 2.4 0 2.85 1.58 2.85 3.63v4.19zM3.56 4.96a1.37 1.37 0 1 1 0-2.74 1.37 1.37 0 0 1 0 2.74zm1.19 8.67H2.37V6h2.38v7.63zM14.82 0H1.18C.53 0 0 .51 0 1.15v13.7C0 15.49.53 16 1.18 16h13.64c.65 0 1.18-.51 1.18-1.15V1.15C16 .51 15.47 0 14.82 0z"
          />
        </svg>
      </a>

      <a
        :href="socialLinks.X"
        target="blank"
        rel="noopener"
        aria-label="X"
        class="text-fg-subtle hover:text-accent inline-flex items-center justify-center p-2 transition-colors max-md:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path
            d="M12.6 0h2.454l-5.36 6.155L16 16h-4.937l-3.867-5.07L2.771 16H.316l5.733-6.57L0 0h5.063l3.495 4.633L12.601 0zm-.86 14.376h1.36L4.323 1.394H2.865l8.875 12.982z"
          />
        </svg>
      </a>

      <a
        :href="socialLinks.BLUE_SKY"
        target="blank"
        rel="noopener"
        aria-label="Bluesky"
        class="text-fg-subtle hover:text-accent inline-flex items-center justify-center p-2 transition-colors max-md:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 24 16" fill="currentColor">
          <path
            d="M12 10.8c-.9-2.1-3.3-6-5.3-7.9C5 1.3 3.7.5 2.5.5 1.1.5 0 1.6 0 3v2.3c0 1.4.8 2.6 2 3.1v.1C.9 9 0 10.3 0 11.8c0 2.5 2 4.5 4.5 4.5 1.3 0 2.5-.5 3.4-1.4L12 11l4.1 3.9c.9.9 2.1 1.4 3.4 1.4 2.5 0 4.5-2 4.5-4.5 0-1.5-.9-2.8-2-3.4v-.1c1.2-.5 2-1.7 2-3.1V3c0-1.4-1.1-2.5-2.5-2.5-1.2 0-2.5.8-4.2 2.4-2 1.9-4.4 5.8-5.3 7.9z"
          />
        </svg>
      </a>

      <button
        id="mobileMenuToggle"
        type="button"
        :aria-label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
        :aria-expanded="isMobileMenuOpen"
        aria-controls="mobileMenu"
        class="text-fg-subtle hover:text-accent inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-2 transition-colors md:hidden"
        @click="toggleMobileMenu"
      >
        <svg
          v-if="!isMobileMenuOpen"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        >
          <path d="M2 5h14M2 9h14M2 13h14" />
        </svg>
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        >
          <path d="M4 4l10 10M14 4L4 14" />
        </svg>
      </button>
    </div>
  </nav>
</template>
