<script setup lang="ts">
import AppNav from "@components/AppNav.vue";
import AppMobileMenu from "@components/AppMobileMenu.vue";
import AppFooter from "@components/AppFooter.vue";
import AppSearch from "@components/AppSearch.vue";
</script>

<template>
  <AppNav />
  <AppMobileMenu />
  <AppSearch />
  <Content />
  <AppFooter />
</template>
