<script setup lang="ts">
import { useRevealAnimations } from "@composables/useRevealAnimations";
import HomeHero from "@components/HomeHero.vue";
import HomeProjects from "@components/HomeProjects.vue";
import HomeExperience from "@components/HomeExperience.vue";
import HomeContact from "@components/HomeContact.vue";
import HomeBlog from "@components/HomeBlog.vue";
// @todo Instagram "From the Feed" section is hidden while the account is
// disabled. Re-enable by restoring this import and the <HomeInstagram /> below.
// import HomeInstagram from "@components/HomeInstagram.vue";
import HomeTravelMap from "@components/HomeTravelMap.vue";

useRevealAnimations();
</script>

<template>
  <HomeHero />
  <HomeProjects />
  <HomeExperience />
  <HomeContact />
  <HomeTravelMap />
  <HomeBlog />
  <!-- <HomeInstagram /> hidden while the Instagram account is disabled -->
</template>
