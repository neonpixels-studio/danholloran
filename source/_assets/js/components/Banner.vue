<template hidden>
  <div
    :class="`flex items-center justify-center w-full ${outerBackground} border p-16 flex-col`"
  >
    <div class="mb-8">
      <div class="flex flex-wrap justify-center -mx-4">
        <!-- Width -->
        <div class="mx-4 mb-8">
          <label for="width" class="block font-bold">Width</label>
          <div class="flex border">
            <input
              type="number"
              min="0"
              step="10"
              placeholder="Width"
              id="width"
              class="px-4 py-2"
              v-model="width"
            />
            <span class="flex items-center px-4 bg-gray-200">px</span>
          </div>
        </div>

        <!-- Height -->
        <div class="mx-4 mb-8">
          <label for="height" class="block font-bold">Height</label>
          <div class="flex border">
            <input
              type="number"
              min="0"
              step="10"
              placeholder="Height"
              id="height"
              class="px-4 py-2"
              v-model="height"
            />
            <span class="flex items-center px-4 bg-gray-200">px</span>
          </div>
        </div>

        <!-- Theme -->
        <div class="mx-4 mb-8">
          <label for="theme" class="block font-bold">Theme</label>
          <div class="px-4 py-2 bg-white border">
            <select class="h-full" name="theme" id="theme" v-model="theme">
              <option
                :value="option.value"
                v-for="option in themeOptions"
                :key="option.value"
                v-text="option.label"
              ></option>
            </select>
          </div>
        </div>

        <!-- Background -->
        <div class="mx-4 mb-8">
          <label for="background" class="block font-bold"
            >Background Color</label
          >
          <div class="px-4 py-2 bg-white border">
            <select
              class="h-full"
              name="background"
              id="background"
              v-model="background"
            >
              <option value="bg-white">White</option>
              <option value="bg-black">Black</option>
              <option value="bg-primary-300">Theme 1 (300)</option>
              <option value="bg-primary-400">Theme 1 (400)</option>
              <option value="bg-primary-500">Theme 1 (500)</option>
              <option value="bg-primary-600">Theme 1 (600)</option>
              <option value="bg-primary-700">Theme 1 (700)</option>
              <option value="bg-primary-800">Theme 1 (800)</option>
              <option value="bg-primary-900">Theme 1 (900)</option>
            </select>
          </div>
        </div>

        <!-- Font Size -->
        <div class="mx-4 mb-8">
          <label for="font_size" class="block font-bold">Font Size</label>
          <div class="flex border">
            <input
              type="number"
              min="0"
              step=".25"
              placeholder="Font Size"
              id="font_size"
              class="px-4 py-2"
              v-model="fontSize"
            />
            <span class="flex items-center px-4 bg-gray-200">rem</span>
          </div>
        </div>

        <!-- Logo Width -->
        <div class="mx-4 mb-8">
          <label for="logo_width" class="block font-bold">Logo Width</label>
          <div class="flex border">
            <input
              type="number"
              min="0"
              step=".25"
              placeholder="Logo Width"
              id="logo_width"
              class="px-4 py-2"
              v-model="logoWidth"
            />
            <span class="flex items-center px-4 bg-gray-200">rem</span>
          </div>
        </div>

        <!-- Logo Position -->
        <div class="mx-4 mb-8">
          <label for="logo_position" class="block font-bold"
            >Logo Position</label
          >
          <div class="px-4 py-2 bg-white border">
            <select
              class="h-full"
              name="logo_position"
              id="logo_position"
              v-model="logoPosition"
            >
              <option
                :value="option.value"
                v-for="option in logoPositionOptions"
                :key="option.value"
                v-text="option.label"
              ></option>
            </select>
          </div>
        </div>
      </div>
      <!-- Message -->
      <div>
        <label for="message" class="block font-bold">Message</label>
        <textarea
          name="message"
          id="message"
          rows="3"
          v-model="message"
          placeholder="message"
          class="w-full px-4 py-2 border"
        ></textarea>
      </div>
    </div>

    <HtmlDownloader
      v-if="downloadNode"
      v-model="downloadFiletype"
      :data-node="downloadNode"
      data-filename="danholloran-banner"
      class="mb-16"
    ></HtmlDownloader>

    <div
      ref="banner"
      :class="`bg-topographic ${textColor} flex  p-8 ${background} ${logoPositionClasses} relative`"
      :style="{
        width: `${this.width}px`,
        height: `${this.height}px`,
      }"
    >
      <div
        class="absolute inset-0 flex items-end justify-end px-8 pt-8 pb-32"
        v-if="message"
      >
        <div
          class="flex items-center justify-center w-full h-full font-extrabold leading-tight whitespace-pre-wrap hover:bg-gray-500 hover:bg-opacity-50"
        >
          <div
            v-html="message"
            :style="{ 'font-size': `${fontSize}rem` }"
          ></div>
        </div>
      </div>
      <div :style="{ width: `${logoWidth}rem`, maxWidth: '100%' }">
        <slot name="logo"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { themes, setTheme, themeOptions, getTheme } from "../theme";
import collect from "collect.js";
import HtmlDownloader from "./HtmlDownloader";

const storageKey = "dh:banner-data";

export default {
  components: {
    HtmlDownloader,
  },

  data() {
    return {
      width: this.getItemFromStorage("width", 1000),
      height: this.getItemFromStorage("height", 500),
      background: this.getItemFromStorage("background", "bg-primary-800"),
      message: this.getItemFromStorage("message", ""),
      fontSize: this.getItemFromStorage("fontSize", 2.625),
      logoWidth: this.getItemFromStorage("logoWidth", 12),
      logoPosition: this.getItemFromStorage("logoPosition", "bottom-right"),
      theme: getTheme(),
      downloadFiletype: this.getItemFromStorage("downloadFiletype", "toPng"),
      themes,
      themeOptions,
      downloadNode: undefined,
    };
  },
  computed: {
    textColor() {
      return this.background === "bg-white" ? "text-primary-800" : "text-white";
    },

    outerBackground() {
      return this.background === "bg-white" ? "bg-gray-500" : "bg-white";
    },

    logoPositionClasses() {
      const option = collect(this.logoPositionOptions)
        .where("value", this.logoPosition)
        .first();

      return option ? option.classes : "";
    },

    logoPositionOptions() {
      return [
        {
          value: "top-left",
          label: "Top Left",
          classes: "items-start justify-start",
        },
        {
          value: "top-center",
          label: "Top Center",
          classes: "items-start justify-center",
        },
        {
          value: "top-right",
          label: "Top Right",
          classes: "items-start justify-end",
        },
        {
          value: "center-left",
          label: "Center Left",
          classes: "items-center justify-start",
        },
        {
          value: "center-center",
          label: "Center Center",
          classes: "items-center justify-center",
        },
        {
          value: "center-right",
          label: "Center Right",
          classes: "items-center justify-end",
        },
        {
          value: "bottom-left",
          label: "Bottom Left",
          classes: "items-end justify-start",
        },
        {
          value: "bottom-center",
          label: "Bottom Center",
          classes: "items-end justify-center",
        },
        {
          value: "bottom-right",
          label: "Bottom Right",
          classes: "items-end justify-end",
        },
      ];
    },
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
    },

    setTheme() {
      return setTheme(this.theme);
    },
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
    },
    logoWidth(value) {
      this.setItemInStorage("logoWidth", value);
    },
    logoPosition(value) {
      this.setItemInStorage("logoPosition", value);
    },
    downloadFiletype(value) {
      this.setItemInStorage("downloadFiletype", value);
    },
    theme() {
      this.setTheme();
    },
  },

  mounted() {
    this.setTheme();
    this.downloadNode = this.$refs.banner;
  },
};
</script>

<style></style>
