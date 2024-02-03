<script setup>
import { inject } from "vue";
import { useData } from "vitepress";

const { frontmatter } = useData();

const socialNavigationItems = inject("socialNavigationItems");
</script>
``

<template>
  <div>
    <nav class="flex flex-wrap -mb-8">
      <a
        :href="item.link"
        v-for="item in socialNavigationItems"
        :key="item.link"
        :title="item.label"
        target="_blank"
        class="last:mr-0 h-[1em] lg:mr-4 mr-8 mb-8 flex rounded-full items-center justify-center plain"
        :class="{
          '!text-white hover:!text-pink-500': frontmatter.is_home,
        }"
      >
        <component
          v-if="item.icon"
          :is="item.icon"
          class="w-auto h-[1em] fill-current"
        ></component>
        <span class="sr-only" v-text="item.label" />
      </a>
    </nav>
  </div>
</template>
