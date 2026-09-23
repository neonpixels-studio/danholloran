<script setup lang="ts">
// Shared by HomeBlog's featured card, PostsView's list thumbnails, and
// PostView's hero — the one place that turns a post's original full-
// resolution frontmatter image into a <picture> serving avif/webp variants
// sized for the calling context. See responsiveImage.ts for the
// srcset/naming scheme and eligibility check, and generateImageVariants.ts
// for how the variant files are produced (and why a failed generation run
// fails the whole build rather than shipping a gap).
import { computed } from "vue";
import {
  isVariantEligible,
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

const eligible = computed(() => isVariantEligible(src));
const sources = computed(() => resolveResponsiveImageSources(src, variant));
</script>

<template>
  <picture v-if="eligible">
    <source :srcset="sources.avifSrcset" type="image/avif" :sizes="sizes" />
    <source :srcset="sources.webpSrcset" type="image/webp" :sizes="sizes" />
    <img :src="sources.fallbackSrc" v-bind="$attrs" />
  </picture>
  <!-- No generated variants for this src (see isVariantEligible) — render
       the original image directly rather than a <picture> pointing at urls
       nobody produced. -->
  <img v-else :src="src" v-bind="$attrs" />
</template>
