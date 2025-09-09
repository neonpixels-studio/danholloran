<script setup lang="ts">
import { ResumeEducationInterface } from "../../../types/resume";

defineProps<{
  education: ResumeEducationInterface;
}>();
</script>

<template>
  <div>
    <div
      class="mb-4"
      v-text="`${education.degree} in ${education.field} | ${education.school}`"
    />

    <!-- Skills -->
    <div v-if="education.skills?.length > 0">
      <ul class="-m-1">
        <li
          v-text="skill.name"
          v-for="skill in education.skills"
          class="skill-pill"
        />
      </ul>
    </div>
  </div>
</template>
