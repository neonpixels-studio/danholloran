<script setup>
import { ArrowUturnLeftIcon, HomeModernIcon } from "@heroicons/vue/24/outline";
import BaseQuote from "@/components/BaseQuote.vue";

const handleBackClick = () => window?.history?.back();
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full">
    <div class="mb-2">
      <span class="block font-bold text-[250px] text-gradient leading-none">
        404
      </span>
    </div>

    <div class="mb-12">
      <span class="block font-bold text-5xl text-gradient">
        Page Could Not Be Found
      </span>
    </div>

    <div class="mb-24">
      <button
        class="button-outline-gradient mr-8"
        type="button"
        @click="handleBackClick"
      >
        <ArrowUturnLeftIcon />
        Back
      </button>
      <a href="/" class="button-outline-gradient"> <HomeModernIcon />Home</a>
    </div>

    <BaseQuote author="Seneca">
      We suffer more often in imagination than in reality.
    </BaseQuote>
  </div>
</template>

<style scoped></style>
