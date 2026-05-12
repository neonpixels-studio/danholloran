---
---

<script setup>
import { data as posts } from '@content/posts/posts.data.ts'
import { useData } from 'vitepress'
import PostView from '@views/PostView.vue'

const { params } = useData()
const post = posts.filter(item => {
  return item.frontmatter.slug === params.value.slug
})[0]
</script>

<PostView :post="post" :posts="posts" />
