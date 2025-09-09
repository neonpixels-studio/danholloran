<script setup lang="ts">
import { ArrowDownTrayIcon } from "@heroicons/vue/16/solid";
import jspdf from "jspdf-html2canvas";
import resume from "../../content/resume.ts";
import { ref } from "vue";
// import html2pdf from "html2pdf.js";

const props = defineProps<{
  element: HTMLElement;
}>();

const emit = defineEmits<{
  start: [];
  end: [];
}>();

const downloading = ref(false);

const handleClick = () => {
  emit("start");
  downloading.value = true;
  // @todo Write test to make sure download always works
  setTimeout(() => {
    jspdf(props.element, {
      jsPDF: {
        format: [props.element.offsetWidth, props.element.offsetHeight + 1],
      },
      output: `./${resume.firstName}-${resume.lastName}-resume.pdf`,
    });

    downloading.value = false;
    emit("end");
  }, 500);
};
</script>

<template>
  <div class="mb-12 flex justify-end">
    <button
      type="button"
      :disabled="!props.element || downloading"
      class="button"
      @click="handleClick"
    >
      <ArrowDownTrayIcon class="w-auto h-[1em] mr-1" />
      Download
    </button>
  </div>
</template>
