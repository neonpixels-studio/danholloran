<script setup lang="ts">
import { useRevealAnimations } from "@composables/useRevealAnimations";
import HomeHero from "@components/HomeHero.vue";
import HomeProjects from "@components/HomeProjects.vue";
import HomeExperience from "@components/HomeExperience.vue";
import HomeContact from "@components/HomeContact.vue";
import HomeBlog from "@components/HomeBlog.vue";
import HomeInstagram from "@components/HomeInstagram.vue";

useRevealAnimations();
</script>

<template>
  <HomeHero />
  <HomeProjects />
  <HomeExperience />
  <HomeContact />
  <HomeBlog />
  <HomeInstagram />
</template>
