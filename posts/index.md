---
title: Blog Posts
description: My posts
---

<script setup>
import { data as posts } from '@content/posts/posts.data.ts'
import PostsView from '@views/PostsView.vue'
</script>

<PostsView :posts="posts" />
