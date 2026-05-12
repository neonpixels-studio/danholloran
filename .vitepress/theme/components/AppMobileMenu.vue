<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vitepress";
import { useMainNav } from "@composables/useMainNav.ts";
import { useNavPanels } from "@composables/useNavPanels.ts";
import socialLinks from "@data/socialLinks";

const router = useRouter();
const { navItems } = useMainNav();
const { isMobileMenuOpen, closeAll } = useNavPanels();

function close() {
  closeAll();
}

function navigate(href: string) {
  close();
  router.go(href);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isMobileMenuOpen.value) {
    close();
  }
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      id="mobileMenu"
      :aria-hidden="!isMobileMenuOpen"
      class="no-print bg-bg/97 border-line fixed inset-x-0 top-[60px] z-90 border-b backdrop-blur-md transition-[transform,opacity,visibility] duration-200 md:hidden"
      :class="
        isMobileMenuOpen
          ? 'visible translate-y-0 opacity-100'
          : 'invisible -translate-y-2 opacity-0'
      "
      style="box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04)"
    >
      <div class="flex flex-col px-4 py-3">
        <a
          v-for="(item, index) in navItems"
          :key="item.link"
          :href="item.link"
          class="border-line/60 text-fg hover:text-accent flex items-center justify-between border-b px-2 py-3.5 font-mono text-[0.95rem] tracking-[-0.01em] no-underline transition-colors last:border-b-0"
          @click.prevent="navigate(item.link)"
        >
          <span>{{ item.label.toLowerCase() }}</span>
          <span class="text-fg-subtle font-mono text-[0.6rem]">{{
            String(index + 1).padStart(2, "0")
          }}</span>
        </a>

        <div class="border-line/60 mt-3 flex items-center gap-1 pt-4">
          <span
            class="text-fg-subtle mr-3 font-mono text-[0.6rem] tracking-widest uppercase"
            >elsewhere</span
          >
          <a
            :href="socialLinks.GITHUB"
            target="blank"
            rel="noopener"
            aria-label="GitHub"
            class="text-fg-subtle hover:text-accent inline-flex items-center justify-center p-2 transition-colors"
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
            class="text-fg-subtle hover:text-accent inline-flex items-center justify-center p-2 transition-colors"
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
            class="text-fg-subtle hover:text-accent inline-flex items-center justify-center p-2 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M13.63 13.63h-2.37V9.92c0-.88-.02-2.02-1.23-2.02-1.23 0-1.42.96-1.42 1.96v3.77H6.24V6h2.27v1.04h.03c.32-.6 1.09-1.23 2.24-1.23 2.4 0 2.85 1.58 2.85 3.63v4.19zM3.56 4.96a1.37 1.37 0 1 1 0-2.74 1.37 1.37 0 0 1 0 2.74zm1.19 8.67H2.37V6h2.38v7.63zM14.82 0H1.18C.53 0 0 .51 0 1.15v13.7C0 15.49.53 16 1.18 16h13.64c.65 0 1.18-.51 1.18-1.15V1.15C16 .51 15.47 0 14.82 0z"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <div
      class="no-print bg-fg/20 fixed inset-0 z-80 transition-[opacity,visibility] duration-200 md:hidden"
      :class="isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'"
      @click="close"
    ></div>
  </Teleport>
</template>
