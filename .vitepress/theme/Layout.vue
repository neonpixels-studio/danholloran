<script setup lang="ts">
import TheHeader from "./components/TheHeader.vue";
import TheFooter from "./components/TheFooter.vue";
</script>

<template>
  <div class="flex flex-col h-full text-gray-800">
    <TheHeader />
    <main class="mb-auto">
      <Content />
    </main>
    <TheFooter />
  </div>
</template>
