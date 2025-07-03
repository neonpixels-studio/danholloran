<script setup lang="ts">
import { ref } from "vue";
import quotes from "../../content/quotes.js";
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
} from "@heroicons/vue/16/solid";

const getQuote = () => quotes[Math.floor(Math.random() * quotes.length)];
const quote = ref(getQuote());
const setQuote = () => {
  actionPending.value = true;
  copiedSuccessfully.value = null;

  quote.value = getQuote();
  actionPending.value = false;
};

const actionPending = ref(false);

const copiedSuccessfully = ref(null);
const copyQuoteToClipboard = async () => {
  actionPending.value = true;
  copiedSuccessfully.value = null;

  try {
    await navigator.clipboard.writeText(
      `${quote.value?.content}\n\n- ${quote.value?.author}`
    );
    copiedSuccessfully.value = true;
  } catch (err) {
    copiedSuccessfully.value = false;
  } finally {
    actionPending.value = false;
    setTimeout(() => (copiedSuccessfully.value = null), 2000);
  }
};
</script>

<template>
  <div class="bg-gray-300/25 py-8 text-gray-500 mb-12">
    <div class="container">
      <div class="md:px-12">
        <div class="mb-4">
          <p v-text="`&ldquo;${quote.content}&rdquo;`" class="text-2xl" />
          <span
            v-text="`- ${quote.author}`"
            class="text-lg font-semibold ml-2"
          ></span>
        </div>
        <div class="flex items-center text-sm">
          <button
            @click.prevent="setQuote"
            class="inline-flex items-center mr-4"
            :disabled="actionPending"
            :class="{
              'opacity-50 cursor-not-allowed': actionPending,
            }"
          >
            <ArrowPathIcon class="h-[1em] mr-1" />
            Refresh
          </button>
          <button
            :disabled="actionPending"
            @click.prevent="copyQuoteToClipboard"
            class="inline-flex items-center mr-4"
            :class="{
              'opacity-50 cursor-not-allowed': actionPending,
              'text-success-500': copiedSuccessfully === true,
              'text-danger-500': copiedSuccessfully === false,
            }"
          >
            <!-- Icon -->
            <ClipboardDocumentIcon
              class="h-[1em] mr-1"
              v-if="copiedSuccessfully === null"
            />
            <CheckIcon
              class="h-[1em] mr-1"
              v-else-if="copiedSuccessfully === true"
            />
            <XMarkIcon
              class="h-[1em] mr-1"
              v-else-if="copiedSuccessfully === false"
            />

            <!-- Label -->
            <span v-if="copiedSuccessfully === null">Copy</span>
            <span v-else-if="copiedSuccessfully === true">Copied</span>
            <span v-else-if="copiedSuccessfully === false">Copy Failed</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
