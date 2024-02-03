<script setup>
defineProps({
  author: {
    type: String,
    required: true,
    default: "",
  },
});
</script>

<template>
  <div class="relative flex flex-col items-center">
    <blockquote
      :class="[
        'text-center pointer-events-none font-serif relative flex items-center pt-[120px] text-4xl mb-12',
        `before:content-['“'] before:text-[120px] before:top-0 before:left-0 before:right-0 before:absolute before:text-purple-500 before:leading-none`,
      ]"
    >
      <slot />
    </blockquote>
    <span
      :class="[
        'text-3xl font-light flex items-center relative',
        `before:content-[''] before:w-16 before:h-1 before:bg-purple-500 before:block before:absolute before:left-0 before:-ml-20`,
        `after:content-[''] after:w-16 after:h-1 after:bg-purple-500 after:block after:absolute after:right-0 after:-mr-20`,
      ]"
    >
      {{ author }}
    </span>
  </div>
</template>
