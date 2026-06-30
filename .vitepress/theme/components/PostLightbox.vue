<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from "vue";

const { src, alt = "" } = defineProps<{
  src: string | null;
  alt?: string;
}>();

const emit = defineEmits<{ close: [] }>();

const isOpen = computed(() => Boolean(src));

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && isOpen.value) {
    emit("close");
  }
}

watch(isOpen, (open) => {
  document.body.style.overflow = open ? "hidden" : "";
});

onMounted(() => document.addEventListener("keydown", onKeydown));
onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <!-- Intentionally always dark, independent of the active theme. -->
      <div
        v-if="isOpen"
        class="no-print fixed inset-0 z-[300] flex cursor-zoom-out items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-label="alt || 'Image preview'"
        @click="emit('close')"
      >
        <button
          type="button"
          aria-label="Close image"
          class="absolute top-4 right-5 cursor-pointer border-0 bg-transparent text-[2.2rem] leading-none text-white/70 transition-colors hover:text-white"
          @click.stop="emit('close')"
        >
          &times;
        </button>
        <figure
          class="m-0 flex max-h-full max-w-full flex-col items-center gap-3"
        >
          <img
            :src="src ?? undefined"
            :alt="alt"
            class="max-h-[85vh] max-w-full rounded object-contain shadow-2xl"
            @click.stop
          />
          <figcaption
            v-if="alt"
            class="max-w-prose text-center font-mono text-[0.72rem] text-white/70"
          >
            {{ alt }}
          </figcaption>
        </figure>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.2s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
