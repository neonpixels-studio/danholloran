<template>
  <div class="flex items-center">
    <label for="download_filetype" class="sr-only">Download Filetype</label>
    <div class="px-4 py-2 mr-4 bg-white border">
      <select
        name="download_filetype"
        id="download_filetype"
        v-model="currentValue"
        :disabled="downloading"
      >
        <option
          :value="option.value"
          v-for="option in filetypeOptions"
          :key="option.value"
          v-text="option.label"
        ></option>
      </select>
    </div>
    <button
      type="button"
      class="button button-primary"
      @click="download"
      :disabled="downloading"
    >
      Download
    </button>
  </div>
</template>

<script>
import download from "downloadjs";
import { toPng, toSvg, toJpeg } from "html-to-image";

export default {
  props: {
    value: {
      type: String,
      default: "png",
      validator: function (value) {
        return ["png", "svg", "jpg"].indexOf(value) !== -1;
      },
    },

    dataNode: {
      type: Node,
      required: true,
    },

    dataFilename: {
      type: String,
      default: "download",
    },
  },

  data() {
    return {
      currentValue: this.value,
      downloading: false,
    };
  },

  computed: {
    filetypeOptions() {
      return [
        {
          value: "png",
          label: ".png",
        },
        {
          value: "svg",
          label: ".svg",
        },
        {
          value: "jpg",
          label: ".jpg",
        },
      ];
    },

    extension() {
      switch (this.currentValue) {
        case "png":
          return "png";
        case "svg":
          return "svg";
        case "jpg":
          return "jpg";
      }
    },

    filetypeHandler() {
      switch (this.currentValue) {
        case "png":
          return toPng;
        case "svg":
          return toSvg;
        case "jpg":
          return toJpeg;
      }
    },

    filename() {
      return `${this.dataFilename}.${this.extension}`;
    },
  },

  methods: {
    download() {
      if (!this.filetypeHandler) {
        return;
      }

      this.downloading = true;
      this.filetypeHandler(this.dataNode)
        .then(this.successHandler)
        .catch((error) => {
          this.downloading = false;
          console.error("oops, something went wrong!", error);
        });
    },

    downloadJpg(dataUrl) {
      var link = document.createElement("a");
      link.download = this.filename;
      link.href = dataUrl;
      link.click();
    },

    successHandler(dataUrl) {
      this.downloading = false;
      if (this.currentValue === "jpg") {
        return this.downloadJpg(dataUrl);
      }

      if (["png", "svg"].includes(this.currentValue)) {
        return download(dataUrl, this.filename);
      }
    },
  },

  watch: {
    value(value) {
      this.currentValue = value;
    },

    currentValue(value) {
      this.$emit("input", value);
    },
  },
};
</script>
