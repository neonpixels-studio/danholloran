---
---

<script setup>
import { useData } from 'vitepress'
import PostsView from '@views/PostsView.vue'

const { params } = useData()
</script>

<PostsView
  :view="params.archive"
  :tag="params.tag"
  :tag-label="params.tagLabel"
  :page="Number(params.page)"
/>
