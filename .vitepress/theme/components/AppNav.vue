<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useMainNav } from "@composables/useMainNav.ts";
import { useNavPanels } from "@composables/useNavPanels.ts";
import AppThemeToggle from "@components/AppThemeToggle.vue";
import AppSocialLinks from "@components/AppSocialLinks.vue";

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
    aria-label="Primary"
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
      <template v-for="navItem in navItems" :key="navItem.link">
        <div v-if="navItem.children" class="group relative hidden md:block">
          <a
            :href="navItem.link"
            class="nav-link text-fg-muted hover:text-accent font-mono text-[0.75rem] tracking-[0.02em] lowercase no-underline transition-colors duration-200"
            :class="{ 'text-accent!': navItem.isActive() }"
          >
            {{ navItem.label }}
          </a>
          <div
            class="invisible absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
          >
            <div
              class="border-line bg-bg/95 flex min-w-[170px] flex-col rounded-md border p-1 shadow-lg backdrop-blur-md"
            >
              <a
                v-for="child in navItem.children"
                :key="child.link"
                :href="child.link"
                class="text-fg-muted hover:text-accent hover:bg-fg/5 rounded px-3 py-2 font-mono text-[0.72rem] lowercase no-underline transition-colors"
                :class="{ 'text-accent!': child.isActive() }"
              >
                {{ child.label }}
              </a>
            </div>
          </div>
        </div>
        <a
          v-else
          :href="navItem.link"
          class="nav-link text-fg-muted hover:text-accent hidden font-mono text-[0.75rem] tracking-[0.02em] lowercase no-underline transition-colors duration-200 md:block"
          :class="{ 'text-accent!': navItem.isActive() }"
        >
          {{ navItem.label }}
        </a>
      </template>
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
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
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
      <AppSocialLinks hide-on-mobile />

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
          aria-hidden="true"
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
          aria-hidden="true"
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
