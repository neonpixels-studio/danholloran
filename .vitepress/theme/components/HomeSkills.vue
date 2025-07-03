<script setup lang="ts">
import skills from "../../content/skills";
</script>

<template>
  <div class="container mb-12">
    <div class="-mx-6 flex flex-wrap">
      <div
        class="lg:w-1/5 md:w-1/4 sm:w-1/3 md:px-12 px-6 py-6 flex items-center justify-center"
        v-for="skill in skills"
      >
        <a :href="skill.url" :title="skill.title" class="w-full block">
          <img
            :src="`/images/skills/${skill.imageUrl}`"
            :alt="skill.title"
            class="w-full h-auto"
          />
        </a>
      </div>
    </div>
  </div>
</template>
