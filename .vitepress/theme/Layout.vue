<script setup>
import TheFooter from "@/components/TheFooter.vue";
import TheHeader from "@/components/TheHeader/TheHeader.vue";
import { useData } from "vitepress";
import NotFound from "@/components/NotFound.vue";
import TheHero from "@/components/TheHero.vue";

const { page, frontmatter } = useData();
</script>

<template>
  <div class="flex flex-col h-full bg-topographic">
    <TheHeader />
    <TheHero v-if="frontmatter.is_home" class="-mt-16 lg:-mt-[104px]" />
    <div class="flex-1 container py-12">
      <transition name="fade">
        <Content v-if="!page.isNotFound" />
        <NotFound v-else />
      </transition>
    </div>
    <TheFooter />
  </div>
</template>
