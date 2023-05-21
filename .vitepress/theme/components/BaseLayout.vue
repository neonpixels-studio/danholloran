<!--.vitepress/theme/MyLayout.vue-->
<script setup>
import DefaultTheme from "vitepress/theme";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout class="bg-topographic h-full w-full">
    <template #doc-before>
      <div class="prose">
        <h1 v-text="$frontmatter?.title"></h1>
      </div>
    </template>
    <slot></slot>
  </Layout>
</template>
