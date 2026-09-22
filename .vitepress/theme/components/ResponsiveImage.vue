<script setup lang="ts">
// Shared by HomeBlog's featured card, PostsView's list thumbnails, and
// PostView's hero — the one place that turns a post's original full-
// resolution frontmatter image into a <picture> serving avif/webp variants
// sized for the calling context, falling back to the original image
// untouched. See responsiveImage.ts for the srcset/naming scheme and
// generateImageVariants.ts for how the variant files are produced.
import { computed } from "vue";
import {
  resolveResponsiveImageSources,
  type ImageVariant,
} from "@utils/responsiveImage";

// Non-prop attrs (class, alt, event listeners, aria-*, fetchpriority, role,
// tabindex, …) are meant for the rendered <img>, not the <picture> wrapper,
// so fallthrough is disabled here and applied manually below.
defineOptions({ inheritAttrs: false });

const { src, variant, sizes } = defineProps<{
  // Root-absolute path to the original post image, e.g.
  // "/images/posts/some-post.jpg".
  src: string;
  variant: ImageVariant;
  // Passed straight through to each <source>/<img>'s `sizes` attribute; the
  // caller knows its own layout (card width vs. full-bleed hero).
  sizes: string;
}>();

const sources = computed(() => resolveResponsiveImageSources(src, variant));
</script>

<template>
  <picture>
    <source :srcset="sources.avifSrcset" type="image/avif" :sizes="sizes" />
    <source :srcset="sources.webpSrcset" type="image/webp" :sizes="sizes" />
    <img :src="sources.fallbackSrc" v-bind="$attrs" />
  </picture>
</template>
