<script setup lang="ts">
import { useNewsletter } from "@composables/useNewsletter";

const { email, status, errorMessage, subscribe } = useNewsletter();
</script>

<template>
  <section
    class="fade-in mx-auto mb-24 max-w-275 px-8"
    aria-labelledby="nl-banner-heading"
  >
    <div
      class="bg-accent-dim bg-topography-edge border-line relative overflow-hidden rounded-xs border"
    >
      <div
        class="relative z-10 flex items-center justify-between gap-8 px-8 py-7 max-md:flex-col max-md:items-start"
      >
        <div class="flex items-center gap-4">
          <svg
            width="40"
            height="29"
            viewBox="0 0 22 16"
            fill="none"
            class="text-fg shrink-0"
            aria-hidden="true"
          >
            <path d="M7 14 L13 3 L19 14 Z" fill="currentColor" />
            <path
              d="M11.4 6 L13 3 L14.6 6 L13.7 5.6 L13 6.2 L12.3 5.6 Z"
              fill="#ad46ff"
            />
            <path d="M1 14 L7 5.5 L13 14 Z" fill="#ad46ff" />
            <path
              d="M5.6 8 L7 5.5 L8.4 8 L7.6 7.6 L7 8.1 L6.4 7.6 Z"
              fill="#ffffff"
            />
            <path
              d="M0 14.5 H22"
              stroke="currentColor"
              stroke-width="0.8"
              stroke-linecap="round"
            />
          </svg>
          <div>
            <div
              class="text-accent mb-1.5 font-mono text-[0.62rem] font-semibold tracking-[0.12em] uppercase"
            >
              // the newsletter
            </div>
            <div
              id="nl-banner-heading"
              class="text-fg font-mono text-[1.3rem] leading-[1.1] font-bold tracking-[-0.04em]"
            >
              Don't miss the next one
            </div>
          </div>
        </div>

        <form
          v-if="status !== 'success'"
          class="flex w-full max-w-[400px] gap-2 max-md:max-w-none"
          novalidate
          @submit.prevent="subscribe"
        >
          <input
            v-model="email"
            type="email"
            name="email_address"
            autocomplete="email"
            placeholder="you@domain.com"
            aria-label="Email address"
            :disabled="status === 'loading'"
            class="text-fg border-line focus:border-accent h-11 min-w-0 flex-1 rounded-xs border bg-transparent px-3.5 font-mono text-[0.85rem] transition-colors outline-none"
          />
          <button
            type="submit"
            :disabled="status === 'loading'"
            class="border-accent bg-accent hover:bg-accent-hover hover:border-accent-hover inline-flex h-11 cursor-pointer items-center justify-center rounded-xs border-2 px-[1.4rem] font-mono text-[0.78rem] tracking-[0.02em] whitespace-nowrap text-white transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ status === "loading" ? "…" : "Subscribe" }}
          </button>
        </form>
      </div>

      <div
        v-if="status === 'success' || status === 'error'"
        class="text-accent relative z-10 -mt-3 px-8 pb-6 font-mono text-[0.78rem]"
        aria-live="polite"
      >
        <template v-if="status === 'success'">
          ✓ Almost there — check your inbox to confirm your subscription.
        </template>
        <template v-else> ⚠ {{ errorMessage }} </template>
      </div>
    </div>
  </section>
</template>
