<script setup>
import useNavigation from "@/composables/useNavigation.js";
import useConfetti from "@/composables/useConfetti.js";
import TextInput from "@/components/TextInput.vue";
import TextArea from "@/components/TextArea.vue";
import BaseAlert from "@/components/BaseAlert.vue";
import { ref, onBeforeUnmount, onMounted } from "vue";
import { ArrowPathIcon, ArrowDownIcon } from "@heroicons/vue/24/outline";

const { socialNavigationItems } = useNavigation();
const { unicornFireworks } = useConfetti();

// == Submit ==============================
const isSubmitting = ref(false);
const submittedSuccessfully = ref(null);
const handleSubmit = async ($e) => {
  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  submittedSuccessfully.value = null;

  try {
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData($e.target)).toString(),
    });
    submittedSuccessfully.value = true;
    unicornFireworks();
    clearHash();
  } catch (error) {
    submittedSuccessfully.value = false;
  } finally {
    isSubmitting.value = false;
  }
};
const handleDangerAlertDismiss = () => {
  submittedSuccessfully.value = null;
};

// == Hash Change ==============================
const $form = ref(null);
const $name = ref(null);
const clearHash = () => {
  history.replaceState(
    "",
    document.title,
    window.location.pathname + window.location.search,
  );
};

const handleHashChange = () => {
  const hash = window.location.hash;
  if (hash !== "#contact") {
    return;
  }

  $form.value.scrollIntoView({ behavior: "smooth" });
  $form.value.elements[0].focus();
};
onMounted(() => {
  handleHashChange();
  addEventListener("hashchange", handleHashChange);
});

onBeforeUnmount(() => {
  removeEventListener("hashchange", handleHashChange);
});
</script>

<template>
  <div class="relative">
    <div class="container z-10 relative py-6 lg:py-12 lg:w-3/5">
      <h1 class="text-white">Contact Me</h1>
      <BaseAlert
        type="danger"
        class="mb-12"
        :dismissible="true"
        v-if="submittedSuccessfully === false"
        @dismissed="handleDangerAlertDismiss"
      >
        Something went wrong please try again
      </BaseAlert>
      <div class="relative">
        <form
          ref="$form"
          class="-mx-6 text-bold lg:flex lg:flex-wrap justify-center mb-12"
          name="contact"
          method="POST"
          data-netlify="true"
          @submit.prevent="handleSubmit"
          :class="{
            'opacity-0': submittedSuccessfully,
          }"
        >
          <TextInput
            ref="$name"
            name="name"
            placeholder="Name*"
            label="Name*"
            required
            class="lg:w-1/2 px-6 mb-10"
            :disabled="isSubmitting"
          />
          <TextInput
            name="email"
            placeholder="Email*"
            label="Email*"
            type="email"
            required
            class="lg:w-1/2 px-6 mb-10"
            :disabled="isSubmitting"
          />
          <TextArea
            name="message"
            placeholder="Message*"
            label="Message*"
            required
            class="w-full px-6 mb-6"
            :disabled="isSubmitting"
          />

          <input type="hidden" name="form-name" value="contact" />

          <div class="w-full px-6 flex justify-center">
            <button
              type="submit"
              class="button-outline-light lg:w-1/2 xl:w-1/3 w-full"
              :disabled="isSubmitting"
              :class="{
                'cursor-wait': isSubmitting,
              }"
            >
              <ArrowPathIcon
                class="h-[1em] w-auto mr-2 animate-spin"
                v-show="isSubmitting"
              />
              {{ isSubmitting ? "Submitting..." : "Submit" }}
            </button>
          </div>
        </form>

        <div
          v-show="submittedSuccessfully"
          class="text-white absolute z-10 top-0 left-0 right-0 bottom-0 flex-col flex items-center justify-center"
        >
          <strong class="text-5xl mb-6">Thanks!</strong>
          <p class="font-serif text-3xl mb-6">🦄 Unicorn party time! 🦄</p>
          <p class="text-xl">
            P.S. I'll get back to you ASAP. (Maybe sooner if it's possible...)
          </p>
          <p class="text-xl">
            P.P.S. While you're here, might as well follow me.
            <ArrowDownIcon class="h-[1em] w-auto animate-bounce inline" />
          </p>
        </div>
      </div>

      <nav class="flex items-center pb-8 flex-wrap -mb-8 justify-center">
        <a
          :href="item.link"
          target="_blank"
          v-for="item in socialNavigationItems"
          class="flex items-center !text-white plain group lg:mr-6 mr-8 last:mr-0 mb-8"
          :key="item.link"
        >
          <component
            :is="item.icon"
            v-if="item.icon"
            class="w-8 h-8 fill-current group-hover:fill-pink-500"
          />
          <span v-text="item.label" class="sr-only" />
        </a>
      </nav>

      <div class="flex justify-center text-white w-full">
        &copy; Dan Holloran, {{ new Date().getFullYear() }} | Made with
        <strong class="text-pink-500 mx-1 shadow-sm animate-pulse">♥</strong>
        in St. Louis, MO
      </div>
    </div>
    <div class="bg-gradient absolute top-0 left-0 right-0 bottom-0 z-0" />
  </div>
</template>
