<script setup lang="ts">
import { LinkIcon } from "@heroicons/vue/16/solid";
import resume from "../../content/resume";
import dayjs from "dayjs";

const cleanUrl = (url: string = ""): string => {
  return url
    ?.replace(/http:\/\/|https:\/\//g, "")
    ?.replace(/www./g, "")
    ?.replace(/\/$/g, "");
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
  <div class="container mb-12">
    <h2>Professional Experience</h2>
    <div class="md:flex flex-wrap -mx-6">
      <div
        v-for="experience in resume.experiences"
        class="mb-6 last:mb-0 sm:w-1/2 px-6"
      >
        <h3 class="mb-0!" v-text="experience.role" />

        <h4 class="mb-4!">
          <span class="mr-2 text-primary-500">@</span>
          <span v-text="experience.company" class="font-normal" />
        </h4>
        <div class="text-gray-500">
          <span v-text="formatDate(experience.start)" />
          <template v-if="experience.end">
            <span class="mx-1">-</span>
            <span v-text="formatDate(experience.end)" />
          </template>
        </div>
        <div class="mb-4">
          <a
            :href="experience.url"
            class="inline-flex items-center"
            target="_blank"
          >
            <LinkIcon class="h-[1em]" />
            {{ cleanUrl(experience.url) }}
          </a>
          <span class="mx-1 font-bold text-primary-500">/</span>
          <span
            v-text="
              experience.remote
                ? `${experience.location.formatted} (Remote)`
                : experience.location.formatted
            "
          />
        </div>

        <ul class="list-disc pl-4">
          <li v-for="listItem in experience.details" v-text="listItem" />
        </ul>

        <!-- Skills -->
        <div v-if="experience.skills?.length > 0" class="mt-4">
          <ul class="-m-1">
            <li
              v-text="skill.name"
              v-for="skill in experience.skills"
              class="skill-pill"
            />
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
