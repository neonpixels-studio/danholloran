<script setup>
import { computed } from "vue";
const imageUrl = computed(() => {
  return "/uploads/colorado-mountains.jpg";
});
</script>

<template>
  <div
    class="relative w-full flex items-end bg-cover bg-bottom min-h-[600px] xl:min-h-[800px] text-white"
    :style="`background-image: url(${imageUrl})`"
  >
    <div
      class="bg-gradient absolute top-0 left-0 bottom-0 right-0 opacity-50 z-0"
    ></div>
    <div class="container mb-12 z-10 relative">
      <div class="flex items-center mb-6">
        <img
          class="bg-white text-black rounded-full h-16 w-16 flex items-center justify-center mr-6"
          src="https://gravatar.com/avatar/8776da8b1446e51596822c7da44704b925929d50e2575a89a1901fb3bcbe60f7?s=64"
          loading="lazy"
        />
        <h1 class="plain mb-0 lg:text-4xl text-3xl">
          Hello, I'm <span class="font-serif font-normal">Dan Holloran</span>!
        </h1>
      </div>
      <h2
        class="plain mb-0 font-serif xl:w-2/3 lg:text-3xl text-lg lg:!leading-10 font-normal"
      >
        Full Stack Developer and Photographer based in St. Louis. I love
        traveling and enjoy mentoring others. Let's create something amazing
        together!
      </h2>
    </div>
  </div>
</template>
