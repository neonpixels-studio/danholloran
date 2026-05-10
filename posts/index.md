---
title: Blog Posts
description: My posts
---

<script setup>
import { data as posts } from './../.vitepress/content/posts/posts.data.ts'
</script>

<h2>Posts</h2>
<pre>
  {{JSON.stringify(posts, null, 2)}}
</pre>
