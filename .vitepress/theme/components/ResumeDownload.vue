<script setup lang="ts">
import { ArrowDownTrayIcon } from "@heroicons/vue/16/solid";
import jspdf from "jspdf-html2canvas";
import resume from "../../content/resume.ts";
// import html2pdf from "html2pdf.js";

const props = defineProps<{
  element: HTMLElement;
}>();

const handleClick = () => {
  // @todo Write test to make sure download always works

  // html2pdf(props.element, {
  //   filename: `${resume.firstName}-${resume.lastName}-resume.pdf`,
  //   pagebreak: { mode: "avoid-all", before: ".page2el" },
  //   jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  // });
  jspdf(props.element, {
    jsPDF: {
      format: "letter",
    },
    output: `./${resume.firstName}-${resume.lastName}-resume.pdf`,
  });
};
</script>

<template>
  <div class="mb-12 flex justify-end">
    <button
      type="button"
      :disabled="!props.element"
      class="button"
      @click="handleClick"
    >
      <ArrowDownTrayIcon class="w-auto h-[1em] mr-1" />
      Download
    </button>
  </div>
</template>
