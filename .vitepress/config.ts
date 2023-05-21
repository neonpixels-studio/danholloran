import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Dan Holloran",
  description: "My Personal Blog",
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      // { text: 'Home', link: '/' },
      // { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      // {
      //   text: 'Examples',
      //   items: [
      //     { text: 'Markdown Examples', link: '/markdown-examples' },
      //     { text: 'Runtime API Examples', link: '/api-examples' }
      //   ]
      // }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/dholloran' },
      { icon: 'twitter', link: 'https://twitter.com/dholloran' },
      { icon: 'instagram', link: 'https://instagram.com/dholloran85/' },
      { icon: 'linkedin', link: 'https://linkedin.com/dholloran85/' },
    ]
  }
})
