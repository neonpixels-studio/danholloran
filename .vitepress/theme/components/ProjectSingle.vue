<script setup>
import { useData } from "vitepress";
import projects from "./../../content/projects";
import MarkdownContent from "./MarkdownContent.vue";

// params is a Vue ref
const { params } = useData();
const project = projects.filter(({ slug }) => params.value.slug === slug)[0];
</script>

<template>
  <div class="container flex flex-col items-center">
    <div class="w-[850px] p-6 max-w-full bg-white/50 rounded-lg">
      <div class="mb-12">
        <img :src="`/images/projects/${project.imageUrl}`" />
      </div>
      <h1 v-text="project.title" class="mb-2!" />
      <div>
        <a
          :href="project.url"
          @click.stop
          class="flex items-center text-primary-500"
          target="_blank"
          v-if="project.url"
        >
          <LinkIcon class="h-[1em] w-auto" />
          {{ project.url }}
        </a>
        <span v-else>&nbsp;</span>
        <div>Built @ <span class="font-bold" v-text="project.company" /></div>
        <ul class="flex -mx-2 mt-4 mb-2 flex-wrap">
          <li
            v-for="tag in project.tags ?? []"
            class="rounded-md px-3 py-2 bg-gray-300 mx-2 font-bold inline mb-2 text-sm"
          >
            {{ tag }}
          </li>
        </ul>
      </div>
      <MarkdownContent :content="project.content" />
    </div>
  </div>
</template>
