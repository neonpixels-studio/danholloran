<script setup lang="ts">
import { marked } from "marked";
import { computed } from "vue";

const props = defineProps({
  content: { type: String, default: "" },
});

const html = computed(() => marked.parse(props.content));
</script>

<template>
  <div v-html="html"></div>
</template>
