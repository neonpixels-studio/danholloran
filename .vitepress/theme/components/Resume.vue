<script setup lang="ts">
import resume from "../../content/resume.ts";
import ResumeExperience from "./ResumeExperience.vue";
import ResumeEducation from "./ResumeEducation.vue";
import { ref } from "vue";
import ResumeDownload from "./ResumeDownload.vue";
import { ArrowPathIcon } from "@heroicons/vue/16/solid";

const $resume = ref(null);

const downloading = ref(false);
</script>

<template>
  <div class="container mb-6">
    <ResumeDownload
      :element="$resume"
      v-if="$resume"
      @start="() => (downloading = true)"
      @end="() => (downloading = false)"
    />

    <div
      class="flex bg-primary-500 text-4xl text-white px-8 py-4 rounded-2xl"
      v-if="downloading"
    >
      <ArrowPathIcon class="h-[1em] mr-2 w-auto animate-spin" />
      Generating PDF...
    </div>

    <div
      :class="{
        downloading,
      }"
    >
      <div class="outline-5 outline-gray-300 bg-white max-w-full">
        <div
          ref="$resume"
          class="flex flex-row-reverse md:flex-row items-start resume bg-gray-200 h-full"
        >
          <div class="w-1/3 px-18 py-18 flex-col items-center h-full">
            <div class="px-6">
              <img
                :src="resume.photo.url"
                :alt="
                  resume.photo.alt ??
                  `${resume.firstName} ${resume.lastName} Photo`
                "
                class="rounded-full mb-12"
              />
            </div>

            <!-- Contact -->
            <div class="mb-6">
              <h2>Contact</h2>
              <ul class="text-lg">
                <li v-for="contact in resume.contacts">
                  <a
                    :href="`tel:${contact.unformatted}`"
                    class="flex items-center no-underline! group"
                  >
                    <div
                      class="mr-2"
                      v-if="contact.icon"
                      :class="{
                        'pt-4': downloading,
                      }"
                    >
                      <component :is="contact.icon" class="h-4 w-auto" />
                    </div>

                    <span
                      v-text="contact.formatted"
                      class="text-gray-500 group-hover:text-primary-800 group-hover:underline!"
                    />
                  </a>
                </li>
              </ul>
            </div>

            <!-- Skills -->
            <div v-if="resume.skills()?.length > 0" class="mb-6">
              <h2>Skills</h2>

              <ul class="styled-list text-lg">
                <li v-text="skill.name" v-for="skill in resume.skills()" />
              </ul>
            </div>
          </div>
          <div class="w-2/3 px-12 py-18 h-full bg-white">
            <h1 class="font-normal! text-center text-8xl! leading-none! mb-18!">
              <span v-text="resume.firstName" class="text-black block" />
              <span v-text="resume.lastName" />
            </h1>

            <div
              class="bg-primary-700 text-white -mr-12 pr-12 py-6 -ml-24 pl-24 relative mb-6"
            >
              <p v-text="resume.intro" class="text-lg font-semibold" />
              <div class="intro-triangle absolute left-0 mt-6"></div>
            </div>

            <!-- Experience -->
            <div v-if="resume.experiences?.length > 0">
              <h2>Experience</h2>

              <ul>
                <li v-for="experience in resume.experiences" class="mb-6">
                  <ResumeExperience
                    :experience="experience"
                    :downloading="downloading"
                  />
                </li>
              </ul>
            </div>

            <!-- Education -->
            <div v-if="resume.educations?.length > 0">
              <h2>Education</h2>

              <ul>
                <li v-for="education in resume.educations">
                  <ResumeEducation :education="education" />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.downloading {
  width: 1275px;
  height: 0;
  overflow: hidden;
}
</style>
