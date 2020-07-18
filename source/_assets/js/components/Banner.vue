<template>
  <div :class="`flex items-center justify-center w-full ${outerBackground} border p-16 flex-col`">
    <div class="mb-16">
      <div class="flex justify-center mb-8 -mx-4">
        <!-- Width -->
        <div class="border flex mx-4">
          <label
            for="width"
            class="sr-only"
          >Width</label>
          <input
            type="number"
            min="0"
            step="10"
            placeholder="Width"
            id="width"
            class="py-2 px-4"
            v-model="width"
          >
          <span class="bg-gray-200 px-4 flex items-center">px</span>
        </div>

        <!-- Height -->
        <div class="border flex mx-4">
          <label
            for="height"
            class="sr-only"
          >Height</label>
          <input
            type="number"
            min="0"
            step="10"
            placeholder="Height"
            id="height"
            class="py-2 px-4"
            v-model="height"
          >
          <span class="bg-gray-200 px-4 flex items-center">px</span>
        </div>

        <!-- Background -->
        <div class="mx-4">
          <label
            for="background"
            class="sr-only"
          >Background Color</label>
          <div class="border py-2 px-4 h-full bg-white">
            <select
              class="h-full"
              name="background"
              id="background"
              v-model="background"
            >
              <option value="bg-white">White</option>
              <option value="bg-black">Black</option>
              <option value="bg-theme-1-300">Theme 1 (300)</option>
              <option value="bg-theme-1-400">Theme 1 (400)</option>
              <option value="bg-theme-1-500">Theme 1 (500)</option>
              <option value="bg-theme-1-600">Theme 1 (600)</option>
              <option value="bg-theme-1-700">Theme 1 (700)</option>
              <option value="bg-theme-1-800">Theme 1 (800)</option>
              <option value="bg-theme-1-900">Theme 1 (900)</option>
            </select>
          </div>
        </div>

        <!-- Font Size -->
        <div class="border flex mx-4">
          <label
            for="font_size"
            class="sr-only"
          >Font Size</label>
          <input
            type="number"
            min="0"
            step=".25"
            placeholder="Font Size"
            id="font_size"
            class="py-2 px-4"
            v-model="fontSize"
          >
          <span class="bg-gray-200 px-4 flex items-center">rem</span>
        </div>
      </div>
      <div class="flex justify-center">
        <label
          for="message"
          class="sr-only"
        >Message</label>
        <textarea
          name="message"
          id="message"
          rows="10"
          v-model="message"
          placeholder="message"
          class="border w-full py-2 px-4"
        ></textarea>
      </div>
    </div>
    <div
      :class="`bg-topographic ${textColor} flex items-end justify-end p-8 ${background} relative`"
      :style="{
        width: `${this.width}px`,
        height: `${this.height}px`
      }"
    >
      <div
        class="absolute inset-0 flex items-end justify-end px-8 pb-32 pt-8"
        v-if="message"
      >
        <div class="hover:bg-gray-500 hover:bg-opacity-50 h-full w-full font-extrabold leading-tight flex items-center justify-center whitespace-pre-wrap">
          <div
            v-html="message"
            :style="{'font-size': `${fontSize}rem`}"
          ></div>
        </div>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script>
const storageKey = "dh:banner-data";

export default {
  data() {
    return {
      width: this.getItemFromStorage("width", 1000),
      height: this.getItemFromStorage("height", 500),
      background: this.getItemFromStorage("background", "bg-theme-1-800"),
      message: this.getItemFromStorage("message", ""),
      fontSize: this.getItemFromStorage("fontSize", 2.625)
    };
  },
  computed: {
    textColor() {
      return this.background === "bg-white" ? "text-theme-1-800" : "text-white";
    },

    outerBackground() {
      return this.background === "bg-white" ? "bg-gray-500" : "bg-white";
    }
  },
  methods: {
    getItemsFromStorage() {
      const data = window.localStorage.getItem(storageKey);
      return JSON.parse(data ? data : "{}");
    },

    getItemFromStorage(key, defaultValue = null) {
      const items = this.getItemsFromStorage();
      return items[key] ? items[key] : defaultValue;
    },
    setItemInStorage(key, value) {
      const items = this.getItemsFromStorage();
      items[key] = value;
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    }
  },

  watch: {
    width(value) {
      this.setItemInStorage("width", value);
    },
    height(value) {
      this.setItemInStorage("height", value);
    },
    background(value) {
      this.setItemInStorage("background", value);
    },
    message(value) {
      this.setItemInStorage("message", value);
    },
    fontSize(value) {
      this.setItemInStorage("fontSize", value);
    }
  }
};
</script>

<style>
</style>
