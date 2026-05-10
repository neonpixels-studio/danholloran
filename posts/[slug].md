---
title: "@todo Post Title"
description: "@todo Post Description"
---

<script setup>
import { data as posts } from './../.vitepress/content/posts/posts.data.ts'
import { useData } from 'vitepress'

const { params } = useData()
const post = posts.filter(item => {
  console.log(item.frontmatter.slug, params.value.slug)
  return item.frontmatter.slug === params.value.slug
})[0]
</script>

<h2>Post</h2>
<pre>
  {{JSON.stringify(post, null, 2)}}
</pre>
