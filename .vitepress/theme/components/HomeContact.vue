<script setup lang="ts">
import { ref } from "vue";
import { CURRENT_LOCATION } from "@data/resume";

const formName = ref("");
const formEmail = ref("");
const formMessage = ref("");
const formStatus = ref("");
const formError = ref(false);
const formSubmitting = ref(false);

async function handleSubmit() {
  formStatus.value = "";
  formSubmitting.value = true;
  formError.value = false;
  try {
    const body = new URLSearchParams({
      "form-name": "contact_form",
      name: formName.value,
      email: formEmail.value,
      message: formMessage.value,
    });
    const res = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (res.ok) {
      formStatus.value = "Message sent — I'll be in touch soon.";
      formName.value = "";
      formEmail.value = "";
      formMessage.value = "";
    } else {
      formError.value = true;
      formStatus.value = "Something went wrong. Please try again.";
    }
  } catch {
    formError.value = true;
    formStatus.value = "Network error. Please try again.";
  } finally {
    formSubmitting.value = false;
  }
}
</script>

<template>
  <section id="contact" class="border-line border-t px-8 py-20">
    <div class="mx-auto max-w-275">
      <div class="accent-line in mb-6"></div>
      <div
        class="grid grid-cols-[320px_1fr] items-start gap-16 max-lg:grid-cols-1 max-lg:gap-10"
      >
        <div class="reveal-left in">
          <div
            class="text-fg-subtle mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-widest uppercase"
          >
            <span class="bg-accent inline-block h-px w-6"></span>
            say hello
          </div>
          <h2
            class="mb-4 font-mono leading-[0.95] font-bold"
            style="
              font-size: clamp(1.6rem, 3vw, 2.2rem);
              letter-spacing: var(--tracking-tightest);
            "
          >
            Get in<br />Touch
          </h2>
          <p class="text-fg-muted mb-6 font-mono text-[0.78rem] leading-[1.7]">
            Have a project, a question, or just want to swap notes on Vue,
            photography, or travel? Drop a message — I read everything.
          </p>
          <div class="text-fg-subtle font-mono text-[0.7rem] leading-[1.85]">
            <div>
              <span class="text-fg-subtle">↳</span>
              avg. response ·
              <span class="text-fg">24–48h</span>
            </div>
            <div>
              <span class="text-fg-subtle">↳</span>
              currently in ·
              <span class="text-fg">{{ CURRENT_LOCATION }}</span>
            </div>
            <div>
              <span class="text-fg-subtle">↳</span>
              open to ·
              <span class="text-fg">full-time, contract</span>
            </div>
          </div>
        </div>

        <form
          id="contactForm"
          name="contact_form"
          data-netlify="true"
          class="reveal-right stagger in flex flex-col gap-5"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <input type="hidden" name="form-name" value="contact_form" />
          <div class="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
            <label class="flex flex-col gap-2">
              <span
                class="text-fg-subtle flex items-center justify-between font-mono text-[0.62rem] tracking-widest uppercase"
              >
                <span>01 / Name</span>
                <span class="text-accent">*</span>
              </span>
              <input
                v-model="formName"
                type="text"
                name="name"
                required
                autocomplete="name"
                placeholder="Your full name"
                class="contact-input text-fg border-line placeholder:text-fg-subtle focus:border-accent border-0 border-b bg-transparent px-0 py-2.5 font-mono text-[0.9rem] transition-colors duration-200 outline-none placeholder:font-mono"
              />
            </label>
            <label class="flex flex-col gap-2">
              <span
                class="text-fg-subtle flex items-center justify-between font-mono text-[0.62rem] tracking-widest uppercase"
              >
                <span>02 / Email</span>
                <span class="text-accent">*</span>
              </span>
              <input
                v-model="formEmail"
                type="email"
                name="email"
                required
                autocomplete="email"
                placeholder="you@domain.com"
                class="contact-input text-fg border-line placeholder:text-fg-subtle focus:border-accent border-0 border-b bg-transparent px-0 py-2.5 font-mono text-[0.9rem] transition-colors duration-200 outline-none placeholder:font-mono"
              />
            </label>
          </div>
          <label class="flex flex-col gap-2">
            <span
              class="text-fg-subtle flex items-center justify-between font-mono text-[0.62rem] tracking-widest uppercase"
            >
              <span>03 / Message</span>
              <span class="text-accent">*</span>
            </span>
            <textarea
              v-model="formMessage"
              name="message"
              required
              rows="5"
              placeholder="Tell me a little about what you're working on…"
              class="contact-input text-fg border-line placeholder:text-fg-subtle focus:border-accent resize-y border-0 border-b bg-transparent px-0 py-2.5 font-mono text-[0.9rem] leading-[1.65] transition-colors duration-200 outline-none placeholder:font-mono"
            ></textarea>
          </label>
          <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div
              id="contactStatus"
              class="text-fg-subtle min-h-[1em] font-mono text-[0.65rem] tracking-[0.02em]"
              aria-live="polite"
              :class="{
                'text-red-500': formError,
                'text-green-500': !formError,
              }"
            >
              {{ formStatus }}
            </div>
            <button
              type="submit"
              :disabled="formSubmitting"
              class="btn-base bg-accent border-accent hover:bg-accent-hover hover:border-accent-hover inline-flex items-center gap-2 border-2 text-white hover:-translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>send message</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 6H10M10 6L6.5 2.5M10 6L6.5 9.5"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
