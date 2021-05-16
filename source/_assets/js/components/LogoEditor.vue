<template hidden>
  <div class="flex flex-col items-center justify-center w-full p-16">
    <div class="mb-8">
      <div class="flex flex-wrap justify-center -mx-4">
        <!-- Width -->
        <div class="mx-4 mb-8">
          <label for="width" class="block font-bold">Width</label>
          <div class="flex border">
            <input
              type="number"
              min="0"
              step=".25"
              placeholder="Width"
              id="width"
              class="px-4 py-2"
              v-model="width"
            />
            <span class="flex items-center px-4 bg-gray-200">rem</span>
          </div>
        </div>

        <!-- Color -->
        <div class="mx-4 mb-8">
          <label for="color" class="block font-bold">Color</label>
          <div class="px-4 py-2 bg-white border">
            <select class="h-full" name="color" id="color" v-model="color">
              <option
                :value="option.value"
                v-for="option in colorOptions"
                :key="option.value"
                v-text="option.label"
              ></option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <HtmlDownloader
      v-if="downloadNode"
      v-model="downloadFiletype"
      :data-node="downloadNode"
      data-filename="danholloran-logo"
      class="mb-16"
    ></HtmlDownloader>

    <div class="flex items-center justify-center w-full py-16 bg-graph-paper">
      <div
        ref="logo"
        :style="{ width: `${width}rem`, maxWidth: '100%' }"
        :class="color"
      >
        <slot name="logo"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import HtmlDownloader from "./HtmlDownloader";

const storageKey = "dh:logo-data";

export default {
  components: {
    HtmlDownloader,
  },

  data() {
    return {
      width: this.getItemFromStorage("width", 12),
      downloadFiletype: this.getItemFromStorage("downloadFiletype", "png"),
      downloadNode: undefined,
      color: "text-white",
    };
  },

  computed: {
    colorOptions() {
      return [
        {
          value: "text-white",
          label: "White",
        },
        {
          value: "text-black",
          label: "black",
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
  },

  watch: {
    width(value) {
      this.setItemInStorage("width", value);
    },

    color(value) {
      this.setItemInStorage("color", value);
    },

    downloadFiletype(value) {
      this.setItemInStorage("downloadFiletype", value);
    },
  },

  mounted() {
    this.downloadNode = this.$refs.logo;
  },
};
</script>

<style></style>
