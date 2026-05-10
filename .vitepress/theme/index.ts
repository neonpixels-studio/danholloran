import type { Theme } from "vitepress";
import AppLayout from "./AppLayout.vue";
import NotFoundView from "@views/NotFoundView.vue";
import "./style.css";

export default {
  Layout: AppLayout,
  NotFound: NotFoundView,
  enhanceApp() {},
} satisfies Theme;
