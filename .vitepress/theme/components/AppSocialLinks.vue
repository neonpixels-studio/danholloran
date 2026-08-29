<script setup lang="ts">
import socialLinks from "@data/socialLinks";

// `hideOnMobile` adds `max-md:hidden` to every link — the top nav hides these
// below the `md` breakpoint (the mobile menu renders its own copy), while the
// mobile menu shows them and omits the prop.
defineProps<{
  hideOnMobile?: boolean;
}>();

type SocialIcon = {
  label: string;
  href: string;
  svg: string;
};

// Static, trusted SVG markup rendered via v-html — no user input flows here.
const socialIcons: SocialIcon[] = [
  {
    label: "GitHub",
    href: socialLinks.GITHUB,
    svg: `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`,
  },
  {
    label: "Instagram",
    href: socialLinks.INSTAGRAM,
    svg: `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="1.5" width="13" height="13" rx="3.5" /><circle cx="8" cy="8" r="3.2" /><circle cx="11.8" cy="4.2" r="0.7" fill="currentColor" stroke="none" /></svg>`,
  },
  {
    label: "LinkedIn",
    href: socialLinks.LINKEDIN,
    svg: `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.63 13.63h-2.37V9.92c0-.88-.02-2.02-1.23-2.02-1.23 0-1.42.96-1.42 1.96v3.77H6.24V6h2.27v1.04h.03c.32-.6 1.09-1.23 2.24-1.23 2.4 0 2.85 1.58 2.85 3.63v4.19zM3.56 4.96a1.37 1.37 0 1 1 0-2.74 1.37 1.37 0 0 1 0 2.74zm1.19 8.67H2.37V6h2.38v7.63zM14.82 0H1.18C.53 0 0 .51 0 1.15v13.7C0 15.49.53 16 1.18 16h13.64c.65 0 1.18-.51 1.18-1.15V1.15C16 .51 15.47 0 14.82 0z"/></svg>`,
  },
  {
    label: "X",
    href: socialLinks.X,
    svg: `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.6 0h2.454l-5.36 6.155L16 16h-4.937l-3.867-5.07L2.771 16H.316l5.733-6.57L0 0h5.063l3.495 4.633L12.601 0zm-.86 14.376h1.36L4.323 1.394H2.865l8.875 12.982z"/></svg>`,
  },
  {
    label: "Bluesky",
    href: socialLinks.BLUE_SKY,
    svg: `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 16" fill="currentColor"><path d="M12 10.8c-.9-2.1-3.3-6-5.3-7.9C5 1.3 3.7.5 2.5.5 1.1.5 0 1.6 0 3v2.3c0 1.4.8 2.6 2 3.1v.1C.9 9 0 10.3 0 11.8c0 2.5 2 4.5 4.5 4.5 1.3 0 2.5-.5 3.4-1.4L12 11l4.1 3.9c.9.9 2.1 1.4 3.4 1.4 2.5 0 4.5-2 4.5-4.5 0-1.5-.9-2.8-2-3.4v-.1c1.2-.5 2-1.7 2-3.1V3c0-1.4-1.1-2.5-2.5-2.5-1.2 0-2.5.8-4.2 2.4-2 1.9-4.4 5.8-5.3 7.9z"/></svg>`,
  },
];
</script>

<template>
  <ul role="list" class="contents">
    <!-- `contents` on the list and items keeps each link a direct flex child of
    the parent, so the surrounding layout (gap, alignment) is unchanged. -->
    <li
      v-for="social in socialIcons"
      :key="social.label"
      role="listitem"
      class="contents"
    >
      <a
        :href="social.href"
        target="_blank"
        rel="noopener"
        :aria-label="social.label"
        class="text-fg-subtle hover:text-accent inline-flex items-center justify-center p-2 transition-colors"
        :class="{ 'max-md:hidden': hideOnMobile }"
        v-html="social.svg"
      ></a>
    </li>
  </ul>
</template>
