<template>
  <div class="gc-titlebar">
    <span class="gc-dot" style="background: #dd9787"></span>
    <span class="gc-dot" style="background: #dada93"></span>
    <span class="gc-dot" style="background: #a9ce93"></span>
    <slot />
  </div>
</template>

<style scoped>
.gc-titlebar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.95rem;
  background: var(--gc-deep);
  border-bottom: 1px solid var(--gc-border);
  transition: background 0.4s ease;
}
.gc-dot {
  display: inline-block;
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
</style>
