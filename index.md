---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

# hero:
#   name: "Dan Holloran"
#   text: "My personal blog"
#   tagline: My great project tagline
#   actions:
#     - theme: brand
#       text: Markdown Examples
#       link: /markdown-examples
#     - theme: alt
#       text: API Examples
#       link: /api-examples
---

<script setup>
import { data as posts } from './loaders/posts.data.ts'
</script>

<div class="container mx-auto mb-12">
  <div class="prose">
    <h1>
      Hello, I'm <span class="title">Dan Holloran.</span>
    </h1>
    <h2>
      I'm a <strong class="title">Full Stack Developer</strong> and <strong class="title">Photographer</strong> based in <strong class="title">St. Louis</strong>. I love traveling and enjoy mentoring others. Let's create something amazing together!
    </h2>
  </div>
</div>

<ul class="container mx-auto">
  <li
    v-for="post in posts"
    :key="post.title"
    class="prose max-w-full mb-6 title"
  >
    <a :href="post.url" class="block">
      <h2 class="m-0" v-text="post.title"></h2>
      <span v-text="post?.date?.string"></span>
    </a>
  </li>
</ul>
