// https://vitepress.dev/guide/custom-theme
import Layout from "./Layout.vue";
import "@/assets/css/index.css";

export default {
  Layout,
  enhanceApp({ app, router, siteData }) {
    // ...
  },
};
