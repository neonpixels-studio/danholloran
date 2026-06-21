<script setup lang="ts">
import AppNav from "@components/AppNav.vue";
import AppMobileMenu from "@components/AppMobileMenu.vue";
import AppFooter from "@components/AppFooter.vue";
import AppSearch from "@components/AppSearch.vue";
</script>

<template>
  <a
    href="#main-content"
    class="focus:border-line focus:bg-bg focus:text-fg sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:rounded focus:border focus:px-4 focus:py-2 focus:outline-none"
  >
    Skip to content
  </a>
  <AppNav />
  <AppMobileMenu />
  <AppSearch />
  <main id="main-content">
    <Content />
  </main>
  <AppFooter />
</template>
