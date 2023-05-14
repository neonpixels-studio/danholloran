<!--.vitepress/theme/MyLayout.vue-->
<script setup>
import DefaultTheme from "vitepress/theme";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout class="bg-topographic h-full w-full">
    <slot></slot>
  </Layout>
</template>
