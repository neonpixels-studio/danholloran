<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vitepress";
import { useMainNav } from "@composables/useMainNav.ts";
import { useNavPanels } from "@composables/useNavPanels.ts";
import { useFocusTrap } from "@composables/useFocusTrap.ts";
import AppSocialLinks from "@components/AppSocialLinks.vue";

const router = useRouter();
const { navItems } = useMainNav();
const { isMobileMenuOpen, closeAll } = useNavPanels();

// Matches the `md` breakpoint the overlay is hidden at; keeping the trap armed
// past it would hijack Tab for a menu the user can no longer see.
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

const menu = ref<HTMLElement | null>(null);
let desktopQuery: MediaQueryList | null = null;

useFocusTrap(menu, isMobileMenuOpen);

function close() {
  closeAll();
}

function navigate(href: string) {
  close();
  router.go(href);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && isMobileMenuOpen.value) {
    close();
  }
}

function closeOnDesktop(event: MediaQueryListEvent) {
  if (!event.matches || !isMobileMenuOpen.value) {
    return;
  }
  close();
}

// Match PostLightbox: a modal dialog locks the page behind it from scrolling.
watch(isMobileMenuOpen, (open) => {
  document.body.style.overflow = open ? "hidden" : "";
});

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
  desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
  desktopQuery.addEventListener("change", closeOnDesktop);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
  desktopQuery?.removeEventListener("change", closeOnDesktop);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <div
      id="mobileMenu"
      ref="menu"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
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
        <button
          type="button"
          class="sr-only focus-visible:not-sr-only focus-visible:mb-2 focus-visible:self-end focus-visible:rounded focus-visible:px-2 focus-visible:py-1 focus-visible:font-mono focus-visible:text-[0.82rem]"
          @click="close"
        >
          close menu
        </button>
        <template v-for="(item, index) in navItems" :key="item.link">
          <a
            :href="item.link"
            class="border-line/60 text-fg hover:text-accent flex items-center justify-between border-b px-2 py-3.5 font-mono text-[0.95rem] tracking-[-0.01em] no-underline transition-colors"
            @click.prevent="navigate(item.link)"
          >
            <span>{{ item.label.toLowerCase() }}</span>
            <span class="text-fg-subtle font-mono text-[0.6rem]">{{
              String(index + 1).padStart(2, "0")
            }}</span>
          </a>
          <a
            v-for="child in item.children"
            :key="child.link"
            :href="child.link"
            class="border-line/60 text-fg-muted hover:text-accent flex items-center border-b py-2.5 pr-2 pl-6 font-mono text-[0.82rem] no-underline transition-colors"
            @click.prevent="navigate(child.link)"
          >
            <span class="text-fg-subtle mr-2">↳</span>
            <span>{{ child.label.toLowerCase() }}</span>
          </a>
        </template>

        <div class="border-line/60 mt-3 flex items-center gap-1 pt-4">
          <span
            class="text-fg-subtle mr-3 font-mono text-[0.6rem] tracking-widest uppercase"
            >elsewhere</span
          >
          <AppSocialLinks />
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
