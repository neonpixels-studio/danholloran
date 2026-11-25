import type { Theme } from "vitepress";
import AppLayout from "./AppLayout.vue";
import NotFoundView from "@views/NotFoundView.vue";
import { startErrorReporting } from "@utils/startErrorReporting";
import "./style.css";

export default {
  Layout: AppLayout,
  NotFound: NotFoundView,
  enhanceApp({ app }) {
    // Deliberately not awaited: the SDK loads after the page is interactive.
    void startErrorReporting(app);
  },
} satisfies Theme;
