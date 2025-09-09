<script setup lang="ts">
import projects from "../../content/projects";

import { LinkIcon } from "@heroicons/vue/16/solid";
</script>

<template>
  <div class="container mb-12">
    <h2>Projects</h2>
    <div class="flex -mx-6 flex-wrap -mb-12">
      <div
        v-for="project in projects"
        class="xl:w-1/3 sm:w-1/2 px-6 mb-12 group"
      >
        <a
          :href="`/projects/${project.slug}`"
          class="flex flex-col border-solid border-gray-300 border-1 rounded-lg no-underline! text-gray-800! overflow-hidden h-full bg-white/50 hover:bg-white"
        >
          <div>
            <img :src="`/images/projects/${project.imageUrl}`" />
          </div>
          <div class="px-6 pt-6 flex-1">
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
            <div>
              <span class="text-primary-500 mr-1 font-bold">@</span>
              <span class="font-bold" v-text="project.company" />
            </div>
            <ul class="flex -mx-2 mt-4 mb-2 flex-wrap">
              <li v-for="skill in project.skills ?? []" class="skill-pill">
                {{ skill.name }}
              </li>
            </ul>
          </div>
          <div
            v-text="`About ${project.title}`"
            class="py-4 bg-primary-500 -mx-6 px-6 text-white font-bold text-center group-hover:bg-primary-800"
          ></div>
        </a>
      </div>
    </div>
  </div>
</template>
