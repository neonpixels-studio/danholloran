<template>
  <div>
    <!-- Quote -->
    <blockquote
      class="w-100"
      :class="{
        'w-100 mt-0 mb-2 p-0 border-0 bg-transparent shadow-none text-primary-500 font-semibold': dataIsForExternal
      }"
    >
      <div
        class="mb-2"
        :class="{
          'text-2xl': dataIsForExternal
        }"
        v-text="quote.text"
      ></div>
      <span
        class="ml-4"
        :class="{
          'text-lg': dataIsForExternal
        }"
      >- {{ quote.author }}</span>
    </blockquote>

    <div class="flex border-l-2 border-transparent">
      <!-- Refresh -->
      <button
        type="button"
        @click="refreshQuote"
        title="Refresh"
        class="flex items-center mr-4"
        :class="{
          'button-link text-gray-500 text-sm': dataIsForExternal,
          'button-small button-primary': dataIsForExternal
        }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-2">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
        Refresh
      </button>

      <!-- Mark as used -->
      <button
        type="button"
        title="Mark as used."
        class="flex items-center mr-4 button-small button-primary"
        v-if="displayMarkAsUsed && !dataIsForExternal"
        @click="markAsUsed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-2">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Mark as used.
      </button>

      <!-- Copy -->
      <copy
        :dataText="copyQuote"
        :class="{
          'button-link text-gray-500 text-sm': dataIsForExternal,
          'button-small button-primary': dataIsForExternal
        }"
      >Copy</copy>
    </div>
  </div>
</template>

<script>
import quotes from './quotes'
import collect from 'collect.js'
import sha1 from 'sha1'
import copy from "./../Copy";

export default {
  props: {
    dataIsForExternal: {
      default: false,
      type: Boolean
    }
  },

  components: {copy},

  data() {
    return {
      quote: quotes.random(),
      displayMarkAsUsed: true,
      storageKey: 'dh:used-quotes'
    };
  },

  computed: {
    copyQuote() {
      return `${this.quote.text}\n\n  - ${this.quote.author}`;
    }
  },

  methods: {
    refreshQuote() {
      const usedQuotes = this.usedQuotes();
      this.displayMarkAsUsed = true;
      this.quote = quotes.reject(quote => usedQuotes.contains(this.usedValue(quote))).random();
    },

    usedQuotes() {
      // We want to display all quotes no matter if then have been marked as used.
      if (this.dataIsForExternal) {
        return collect([]);
      }

      const usedQuotes = window.localStorage.getItem(this.storageKey);

      return usedQuotes ? collect(JSON.parse(usedQuotes)) : collect([]);
    },

    usedValue(quote) {
      return sha1(`${quote.text} - ${quote.author}`);
    },

    markAsUsed() {
      this.displayMarkAsUsed = false;
      const usedValue = this.usedValue(this.quote);
      const usedQuotes = this.usedQuotes().push(usedValue).unique().toJson()

      window.localStorage.setItem(this.storageKey, usedQuotes);
    }
  }
};
</script>
