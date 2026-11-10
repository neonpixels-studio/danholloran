---
---

<script setup lang="ts">
import { useData } from 'vitepress'
import HomeView from '@views/HomeView.vue'

const { params } = useData()
</script>

<HomeView :home="params.home" />
