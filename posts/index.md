---
title: "Thoughts on code, craft & exploration."
description: "A mix of technical deep-dives, career reflections, and dispatches from the road."
---

<script setup>
import { data as posts } from '@content/posts/posts.data.ts'
import PostsView from '@views/PostsView.vue'
</script>

<PostsView :posts="posts" />
