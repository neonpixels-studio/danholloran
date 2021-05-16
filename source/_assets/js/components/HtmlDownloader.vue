<template>
  <div class="flex items-center">
    <div v-if="!dataHideSelect">
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
    </div>
    <button
      type="button"
      class="inline-flex items-center button button-primary"
      @click="download"
      :disabled="downloading"
    >
      {{ downloading ? "Downloading..." : "Download" }}
      <span class="h-5 ml-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          class="fill-current"
        >
          <path
            d="M14 2l6 6v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h8m4 18V9h-5V4H6v16h12m-6-1l-4-4h2.5v-3h3v3H16l-4 4z"
          />
        </svg>
      </span>
    </button>
  </div>
</template>

<script>
import html2pdf from "html2pdf.js";
import download from "downloadjs";
import { toPng, toSvg, toJpeg } from "html-to-image";

export default {
  props: {
    value: {
      type: String,
      default: "png",
      validator: function (value) {
        return ["png", "svg", "jpg", "pdf"].indexOf(value) !== -1;
      },
    },

    dataNode: {
      type: [Node, String],
      required: true,
    },

    dataFilename: {
      type: String,
      default: "download",
    },

    dataHideSelect: {
      type: Boolean,
      default: false,
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
        {
          value: "pdf",
          label: ".pdf",
        },
      ];
    },

    extension() {
      return this.currentValue;
    },

    filetypeHandler() {
      switch (this.currentValue) {
        case "png":
          return toPng;
        case "svg":
          return toSvg;
        case "jpg":
          return toJpeg;
        case "pdf":
          return (node) => {
            return html2pdf(node, {
              filename: this.filename,
              jsPDF: {
                format: "letter",
                orientation: "portrait",
                unit: "in",
              },
            });
          };
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
      let node = this.dataNode;

      if (typeof node === "string") {
        node = document.querySelector(node);
      }

      if (!node) {
        this.downloading = false;
        return;
      }

      this.filetypeHandler(node)
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
