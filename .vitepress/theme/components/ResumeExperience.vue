<script setup lang="ts">
import { ResumeExperienceInterface } from "../../../types/resume";
import { PaperClipIcon } from "@heroicons/vue/16/solid";
import { titleCase } from "title-case";
import dayjs from "dayjs";
import SkillPills from "./SkillPills.vue";

withDefaults(
  defineProps<{
    experience: ResumeExperienceInterface;
    downloading?: boolean;
  }>(),
  {
    experience: undefined,
    downloading: false,
  }
);

const formatUrl = (unformatted?: string): string => {
  if (!unformatted) {
    return "";
  }

  unformatted = unformatted.trim();

  if (unformatted.match(/^\//) !== null) {
    return titleCase(unformatted.replace(/^\/|\/$/g, ""));
  }

  return unformatted.replace(/(https|http):\/\//g, "").replace(/www./g, "");
};

const formatDate = (
  d?: Date,
  template: string = "MMMM YYYY"
): string | undefined => {
  const isDate = d instanceof Date;
  if (!isDate) {
    return undefined;
  }

  return dayjs(d).format(template);
};
</script>

<template>
  <div>
    <div class="flex text-xl">
      <span v-text="experience.role" class="font-bold" />
      <span class="mx-1 text-primary-500 font-bold">@</span>
      <span v-text="experience.company" />
    </div>
    <div>
      <span v-text="formatDate(experience.start)" />
      <span class="text-primary-500 font-bold mx-1">-</span>
      <span v-text="experience.end ? formatDate(experience.end) : 'Present'" />
    </div>
    <div class="flex items-center group mb-4">
      <div
        :class="{
          'pt-4': downloading,
        }"
      >
        <PaperClipIcon
          class="h-4 w-auto text-primary-500 group-hover:text-primary-800"
        />
      </div>
      <a :href="experience.url" v-text="formatUrl(experience.url)" />
      <span class="text-primary-500 font-bold mx-1">/</span>
      <span v-text="experience.location.formatted" />
    </div>

    <ul class="styled-list mb-4">
      <li v-for="detail in experience.details" v-text="detail" />
    </ul>

    <!-- Skills -->
    <div v-if="experience.skills?.length > 0">
      <ul class="-m-1">
        <li
          v-text="skill.name"
          v-for="skill in experience.skills"
          class="skill-pill pb-2"
        />
      </ul>
    </div>
  </div>
</template>
