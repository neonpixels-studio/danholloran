---
---

<script setup lang="ts">
  import { ref } from 'vue'

const count = ref(0)
import { data as posts } from '@content/posts/posts.data.ts'
import projects from '@data/projects.ts'
import resume from '@data/resume.ts'
import HomeView from '@views/HomeView.vue'
</script>

<HomeView :posts="posts" />
