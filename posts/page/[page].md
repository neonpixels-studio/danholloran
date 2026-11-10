---
---

<script setup>
import { useData } from 'vitepress'
import PostsView from '@views/PostsView.vue'

const { params } = useData()
</script>

<PostsView :view="params.archive" :page="Number(params.page)" />
