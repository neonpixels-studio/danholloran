<script setup lang="ts">
import socialLinks from "../../content/social-links";
import TheLogo from "./TheLogo.vue";
</script>

<template>
  <header class="container mx-auto py-12">
    <div class="-mx-6 flex items-center justify-between">
      <a
        class="px-6 text-gray-800! hover:text-primary-800! focus:text-primary-800!"
        href="/"
      >
        <TheLogo class="w-48 fill-current h-auto" />
      </a>

      <div class="flex items-center px-6">
        <!-- @todo Search -->
        <!-- <div class="mr-6">@todo Search</div> -->

        <!-- <nav>
          <ul class="flex">
            <li v-for="link in socialLinks" class="mr-2 last:mr-0">
              <a
                :href="link.url"
                class="no-underline! block h-8 w-8"
                target="_blank"
                :title="link.label"
              >
                <component :is="link.icon" class="h-full w-auto" />
                <span class="sr-only" v-text="link.label" />
              </a>
            </li>
          </ul>
        </nav> -->
      </div>
    </div>
  </header>
</template>
