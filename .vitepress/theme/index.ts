// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import Theme from 'vitepress/theme'
import './style.css'
import BaseLayout from './components/BaseLayout.vue'

export default {
  ...Theme,
  Layout: BaseLayout,
  enhanceApp({ app, router, siteData }) {
    // ...
  }
}
