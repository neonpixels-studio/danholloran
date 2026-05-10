---
title: Dan Holloran
description: Full-stack developer and photographer based in Reno, NV.
---

<script setup lang="ts">
  import { ref } from 'vue'

const count = ref(0)
import { data as posts } from './.vitepress/content/posts/posts.data.ts'
import projects from './.vitepress/data/projects.ts'
import resume from './.vitepress/data/resume.ts'
</script>

<h1>HomePage</h1>

<h2>Projects</h2>
<pre>
  {{JSON.stringify(projects, null, 2)}}
</pre>

<h2>Resume</h2>
<pre>
  {{JSON.stringify(resume, null, 2)}}
</pre>

<h2>Posts</h2>
<pre>
  {{JSON.stringify(posts, null, 2)}}
</pre>
