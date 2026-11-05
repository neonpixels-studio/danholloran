---
postBody: true
---

<script setup>
import { data as posts } from '@content/posts/posts.data.ts'
import { useData } from 'vitepress'
import PostView from '@views/PostView.vue'

const { params } = useData()
const post = posts.find(item => item.frontmatter.slug === params.value.slug)
</script>

<!--
  [slug].paths.ts injects this post's markdown body at the @content marker, so
  each page's chunk carries only its own html. v-pre keeps the body inert, as
  v-html did: a post's prose or inline code containing `{{ }}` is printed, not
  compiled as a Vue expression. postBody in the frontmatter above is what
  markdownZoomImages.ts gates on to make in-body images zoom controls.
-->
<PostView :post="post" :posts="posts">
<div v-pre>

<!-- @content -->

</div>
</PostView>
