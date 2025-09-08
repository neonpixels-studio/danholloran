<script setup lang="ts">
import resume from "../../content/resume";
</script>

<template>
  <!-- Education -->
  <div v-if="resume.educations?.length > 0" class="container mb-12">
    <h2>Education</h2>
    <ul>
      <li v-for="education in resume.educations">
        <div>
          <div
            class="mb-4"
            v-text="
              `${education.degree} in ${education.field} | ${education.school}`
            "
          />

          <!-- Skills -->
          <div v-if="education.skills?.length > 0">
            <ul class="-m-1">
              <li
                v-text="skill.name"
                v-for="skill in education.skills"
                class="skill-pill m-1"
              />
            </ul>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
