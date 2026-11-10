---
---

<script setup>
import { useData } from 'vitepress'
import PostsView from '@views/PostsView.vue'

const { params } = useData()
</script>

<PostsView
  :view="params.archive"
  :topic="params.topic"
  :page="Number(params.page)"
/>
