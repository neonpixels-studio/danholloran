<script setup lang="ts">
import socialLinks from "../../content/social-links.js";
import TheLogo from "./TheLogo.vue";
</script>

<template>
  <header class="container mx-auto py-12">
    <div class="-mx-6 flex items-center justify-between">
      <div class="px-6">
        <TheLogo class="w-48 fill-current h-auto" />
      </div>

      <div class="flex items-center px-6">
        <div class="mr-6">@todo Search</div>

        <nav>
          <ul class="flex">
            <li v-for="link in socialLinks" class="mr-2 last:mr-0">
              <a :href="link.url" class="no-underline!" target="_blank">
                @todo Icon
                {{ link.label }}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </header>
</template>
