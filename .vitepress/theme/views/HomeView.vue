<script setup lang="ts">
import type { HomePosts } from "@typedefs";
import { useRevealAnimations } from "@composables/useRevealAnimations";
import HomeHero from "@components/HomeHero.vue";
import HomeProjects from "@components/HomeProjects.vue";
import HomeExperience from "@components/HomeExperience.vue";
import HomeContact from "@components/HomeContact.vue";
import HomeBlog from "@components/HomeBlog.vue";
import HomeTravelMap from "@components/HomeTravelMap.vue";

// Built at build time by buildHomePosts (see postPageData.ts) so the home
// page ships only the posts it shows, not every post's metadata.
const { home } = defineProps<{
  home: HomePosts;
}>();

useRevealAnimations();
</script>

<template>
  <HomeHero />
  <HomeProjects />
  <HomeExperience />
  <HomeContact />
  <HomeTravelMap :national-park-count="home.nationalParkCount" />
  <HomeBlog :posts="home.latestPosts" />
</template>
