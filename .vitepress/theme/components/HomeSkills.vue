<script setup lang="ts">
import resume from "../../content/resume.ts";
</script>

<template>
  <div class="container mb-12">
    <h2>Skills</h2>
    <div class="-mx-6 flex flex-wrap">
      <div
        class="lg:w-1/5 md:w-1/4 sm:w-1/3 md:px-12 px-6 py-6 flex items-center justify-center"
        v-for="skill in resume.skills()"
      >
        <component
          :is="skill.url ? `a` : `span`"
          :href="skill.url"
          :title="skill.name"
          class="w-full block"
        >
          <img
            :src="`/images/skills/${skill.imageUrl}`"
            :alt="skill.name"
            class="w-full h-auto"
          />
        </component>
      </div>
    </div>
  </div>
</template>
