<script setup lang="ts">
import { onMounted } from "vue";

// https://www.npmjs.com/package/jspdf

const props = defineProps<{
  element: HTMLElement;
}>();

onMounted(() => {
  console.log(props.element);
});
</script>

<template>
  <div>{{ element }}</div>
</template>
