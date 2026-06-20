<script setup lang="ts">
import { useNewsletter } from "@composables/useNewsletter";

const { email, status, errorMessage, subscribe } = useNewsletter();
</script>

<template>
  <section class="mt-16" aria-labelledby="nl-term-heading">
    <div class="nl-term">
      <div class="nl-term-bar">
        <span class="nl-dot nl-dot-r"></span>
        <span class="nl-dot nl-dot-y"></span>
        <span class="nl-dot nl-dot-g"></span>
        <span class="nl-term-path">~/subscribe</span>
      </div>
      <form class="nl-term-body" novalidate @submit.prevent="subscribe">
        <div id="nl-term-heading" class="nl-term-comment">
          # new posts on code, craft &amp; travel — no noise, no schedule
        </div>
        <label for="email_address" class="sr-only">Email address</label>
        <div class="nl-term-cmd">
          <span class="nl-term-prompt">$</span>
          <span class="nl-term-flag">subscribe</span>
          <input
            id="email_address"
            v-model="email"
            type="email"
            name="email_address"
            autocomplete="email"
            placeholder="you@domain.com"
            :disabled="status === 'loading' || status === 'success'"
          />
        </div>
        <div class="nl-term-foot">
          <button
            v-if="status !== 'success'"
            type="submit"
            class="nl-term-run"
            :disabled="status === 'loading'"
          >
            {{ status === "loading" ? "…" : "↵ run" }}
          </button>
          <span class="nl-term-status" aria-live="polite">
            <template v-if="status === 'success'">
              <span class="ok">✓</span> subscribed — check your inbox to
              confirm.
            </template>
            <template v-else-if="status === 'error'">
              <span class="err">⚠</span> {{ errorMessage }}
            </template>
          </span>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.nl-term {
  max-width: 100%;
  overflow: hidden;
  background: #1a1a18;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.18),
    0 12px 36px rgba(0, 0, 0, 0.16);
  font-family: var(--font-mono);
}

.nl-term-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.95rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.nl-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.nl-dot-r {
  background: #ff5f56;
}
.nl-dot-y {
  background: #ffbd2e;
}
.nl-dot-g {
  background: #27c93f;
}

.nl-term-path {
  font-size: 0.7rem;
  color: #6b6b68;
  margin-left: 0.6rem;
  letter-spacing: 0.02em;
}

.nl-term-body {
  padding: 1.5rem 1.5rem 1.6rem;
}

.nl-term-comment {
  font-size: 0.8rem;
  color: #7d7a70;
  margin-bottom: 1.1rem;
  line-height: 1.5;
}

.nl-term-cmd {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.nl-term-prompt {
  color: #c98bff;
  font-size: 0.92rem;
  font-weight: 600;
}

.nl-term-flag {
  color: #e8e6e1;
  font-size: 0.88rem;
}

.nl-term-cmd input {
  flex: 1 1 180px;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  color: #e8e6e1;
  background: transparent;
  border: none;
  outline: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  padding: 0.35rem 0.1rem;
  caret-color: #ad46ff;
}

.nl-term-cmd input::placeholder {
  color: #5c594f;
}

.nl-term-cmd input:focus {
  border-bottom-color: #ad46ff;
}

.nl-term-cmd input:disabled {
  opacity: 0.5;
}

.nl-term-foot {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.3rem;
  flex-wrap: wrap;
}

.nl-term-run {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  cursor: pointer;
  color: #ad46ff;
  background: transparent;
  border: 1px solid rgba(173, 70, 255, 0.55);
  border-radius: 2px;
  padding: 0.5rem 1rem;
  letter-spacing: 0.02em;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.nl-term-run:hover:not(:disabled) {
  background: #ad46ff;
  color: #1a1a18;
  border-color: #ad46ff;
}

.nl-term-run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nl-term-status {
  font-size: 0.8rem;
  color: #cfcdc6;
}

.nl-term-status .ok {
  color: #27c93f;
  font-weight: 700;
  margin-right: 0.3rem;
}

.nl-term-status .err {
  color: #ff7a6e;
  margin-right: 0.3rem;
}
</style>
