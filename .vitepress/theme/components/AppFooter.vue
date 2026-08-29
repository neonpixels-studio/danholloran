<script lang="js" setup>
import { PAST_LOCATIONS } from "@data/resume.ts";
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useData } from "vitepress";

const { frontmatter } = useData();
// Pages that are dark regardless of the site's light/dark setting (e.g.
// Grimicorn Neon) opt in with `forceDarkFooter: true` in their frontmatter.
const isAlwaysDark = computed(() => frontmatter.value.forceDarkFooter === true);

const LOCATION_ROTATE_MS = 3000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const locationIndex = ref(0);
const maxLocationWidth =
  Math.max(...PAST_LOCATIONS.map((l) => `${l.city}, ${l.state}`.length)) + "ch";

let interval;
let reducedMotion;

// Honor prefers-reduced-motion: don't auto-rotate the location text (WCAG
// 2.2.2). Re-evaluated on preference change so a mid-session flip takes hold.
function applyMotionPreference() {
  clearInterval(interval);
  if (reducedMotion.matches) {
    return;
  }
  interval = setInterval(() => {
    locationIndex.value = (locationIndex.value + 1) % PAST_LOCATIONS.length;
  }, LOCATION_ROTATE_MS);
}

onMounted(() => {
  reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  applyMotionPreference();
  reducedMotion.addEventListener("change", applyMotionPreference);
});

onUnmounted(() => {
  clearInterval(interval);
  reducedMotion?.removeEventListener("change", applyMotionPreference);
});
</script>

<template>
  <footer
    class="border-line no-print border-t px-8 py-8 text-center"
    :class="{ dark: isAlwaysDark }"
  >
    <p class="text-fg-subtle font-mono text-[0.7rem]">
      © Dan Holloran {{ new Date().getFullYear() }} ·
      <a href="/posts/" class="text-fg-subtle hover:text-accent no-underline">
        blog
      </a>
      · Built with Vue.js + Tailwind CSS +
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="text-accent heartbeat inline size-4"
      >
        <path
          d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
        />
      </svg>
      in
      <span
        class="inline-block text-left"
        :style="{ minWidth: maxLocationWidth }"
      >
        <Transition name="location-fade" mode="out-in">
          <span :key="locationIndex">
            {{ PAST_LOCATIONS[locationIndex].city }},
            {{ PAST_LOCATIONS[locationIndex].state }}
          </span>
        </Transition>
      </span>
    </p>
  </footer>
</template>

<style scoped>
/* Forced-dark footer (Grimicorn Neon): the .dark class flips the color tokens;
   give it an opaque dark background so it doesn't show the light page behind. */
footer.dark {
  background: var(--color-bg);
}

.heartbeat {
  animation: heartbeat 1.4s ease-in-out infinite;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  10% {
    transform: scale(1.3);
  }
  20% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.2);
  }
  40% {
    transform: scale(1);
  }
  100% {
    transform: scale(1);
  }
}

.location-fade-enter-active,
.location-fade-leave-active {
  transition: opacity 0.3s ease;
}

.location-fade-enter-from,
.location-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .heartbeat {
    animation: none !important;
  }
}
</style>
