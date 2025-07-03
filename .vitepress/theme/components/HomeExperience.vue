<script setup lang="ts">
import experience from "../../content/experience";
import { LinkIcon } from "@heroicons/vue/16/solid";

const cleanUrl = (url: string) => {
  return url
    ?.replace(/http:\/\/|https:\/\//g, "")
    ?.replace(/www./g, "")
    ?.replace(/\/$/g, "");
};
</script>

<template>
  <div class="container mb-12">
    <h2>Professional Experience</h2>
    <div v-for="item in experience" class="mb-6 last:mb-0">
      <h3 class="mb-0!">
        <span v-text="item.title" />
        <span class="mx-2 text-primary-500">/</span>
        <span v-text="item.company" class="font-normal" />
      </h3>
      <div class="text-gray-500">
        <span v-text="item.startDate" />
        <span class="mx-1">-</span>
        <span v-text="item.endDate" />
      </div>
      <div class="mb-4">
        <a :href="item.url" class="inline-flex items-center" target="_blank">
          <LinkIcon class="h-[1em]" />
          {{ cleanUrl(item.url) }}
        </a>
        <span class="mx-1 font-bold text-primary-500">/</span>
        <span
          v-text="item.isRemote ? `${item.location} (Remote)` : item.location"
        />
      </div>

      <ul class="list-disc pl-4">
        <li v-for="listItem in item.listItems" v-text="listItem" />
      </ul>
    </div>
  </div>
</template>
