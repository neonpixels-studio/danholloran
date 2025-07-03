<script setup lang="ts">
import projects from "../../content/projects";
</script>

<template>
  <div class="container mb-12">
    <h2>Projects</h2>
    <div class="flex -mx-6 flex-wrap">
      <div v-for="project in projects" class="xl:w-1/3 sm:w-1/2 px-6 mb-6">
        <a
          :href="`/projects/${project.slug}`"
          class="bg-white border-solid border-gray-300 border-1 rounded-lg no-underline! text-gray-800! block overflow-hidden h-full"
        >
          <div>
            <img :src="`/images/projects/${project.imageUrl}`" />
          </div>
          <div class="px-6 pt-6">
            <span v-text="project.url" class="block"></span>
            <div>
              Built @ <span class="font-bold" v-text="project.company" />
            </div>
            <ul class="flex -mx-2 mt-4 mb-2 flex-wrap">
              <li
                v-for="tag in project.tags ?? []"
                class="rounded-md px-3 py-2 bg-gray-300 mx-2 font-bold inline mb-2 text-sm"
              >
                {{ tag }}
              </li>
            </ul>
            <div
              v-text="`About ${project.title}`"
              class="py-4 bg-primary-500 -mx-6 px-6 text-white font-bold"
            ></div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>
