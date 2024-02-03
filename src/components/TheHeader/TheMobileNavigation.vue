<script setup>
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";
import { ref, inject } from "vue";
import TheSocialNavigation from "@/components/TheHeader/TheSocialNavigation.vue";

const isOpen = ref(false);
const toggleIsOpen = () => (isOpen.value = !isOpen.value);
const primaryNavigationItems = inject("primaryNavigationItems");
const getNavigationItemClasses = inject("getNavigationItemClasses");
</script>

<template>
  <button type="button" @click="toggleIsOpen" v-show="!isOpen">
    <Bars3Icon class="h-8 w-8" />
    <span class="sr-only">Tap to open.</span>
  </button>
  <Teleport to="body">
    <div
      class="absolute top-0 bottom-0 left-0 right-0 h-full w-full bg-gradient text-white z-30 transition-all ease-in-out duration-300"
      :class="{
        'translate-y-[-100%] opacity-0': !isOpen,
        'translate-y-0 opacity-1': isOpen,
      }"
    >
      <div class="container relative px-8 p-16">
        <!--- Toggle Button -->
        <button
          type="button"
          @click="toggleIsOpen"
          v-show="isOpen"
          class="absolute right-0 top-0 mt-4 mr-4"
        >
          <XMarkIcon class="h-8 w-8" />
          <span class="sr-only">Tap to close.</span>
        </button>

        <!-- Primary Navigation -->
        <nav class="flex flex-col pb-12 flex-wrap">
          <a
            :href="item.link"
            v-for="item in primaryNavigationItems"
            :key="item.link"
            class="text-white plain no-underline flex items-center last:mb-0 text-4xl font-bold mb-4"
            :class="getNavigationItemClasses(item.link)"
          >
            <component
              v-if="item.icon"
              :is="item.icon"
              class="w-auto h-8 mr-4"
            ></component>
            {{ item.label }}
          </a>
        </nav>

        <!-- Social Navigation -->
        <h3>Connect With Me</h3>
        <TheSocialNavigation class="text-3xl" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped></style>
