---
---

<script setup>
import { data as posts } from '@content/posts/posts.data.ts'
import { useData } from 'vitepress'
import PostsView from '@views/PostsView.vue'

const { params } = useData()
</script>

<PostsView :posts="posts" :page="Number(params.page)" />
