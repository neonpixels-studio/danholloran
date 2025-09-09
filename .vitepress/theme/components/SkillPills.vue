<script setup lang="ts">
import { ResumeSkillInterface } from "../../../types/resume";

withDefaults(
  defineProps<{
    skills: ResumeSkillInterface[];
    downloading?: boolean;
  }>(),
  {
    downloading: false,
  }
);
</script>

<template>
  <div v-if="skills?.length > 0">
    <ul class="-mr-1 -mb-1 flex flex-wrap">
      <li v-for="skill in skills" class="mr-1 mb-1">
        <div class="bg-primary-500 text-white text-xs py-1 px-2 rounded-xl">
          <span
            v-text="skill.name"
            class="block bg-red-500"
            :class="{
              '-mt-2': downloading,
            }"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
