---
title: "Blog: Thoughts on code, craft & exploration."
description: "A mix of technical deep-dives, career reflections, and dispatches from the road."
---

<script setup>
import { useData } from 'vitepress'
import PostsView from '@views/PostsView.vue'

const { params } = useData()
</script>

<PostsView :view="params.archive" />
