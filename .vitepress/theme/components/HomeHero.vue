<script setup lang="ts">
const scrollToContact = () => {
  const $contact = document.querySelector("form#contact");
  if (!$contact) {
    return;
  }

  $contact?.scrollIntoView();

  const $inputs = $contact?.getElementsByTagName("input")[0];
  if (!$inputs) {
    return;
  }

  $inputs.focus();
};
</script>

<template>
  <div class="container mb-12">
    <div class="md:px-12">
      <div
        class="flex items-center justify-between mb-6 flex-col-reverse md:flex-row"
      >
        <div class="md:w-2/3 h-full">
          <h1 class="mb-6">
            Hello, I'm <span class="text-gray-400">Dan Holloran</span>.
          </h1>
          <p class="font-bold text-4xl">
            I'm a <span class="text-gray-400">Full Stack Developer</span>,
            <span class="text-gray-400">Photographer</span>, and
            <span class="text-gray-400">Traveler</span> based in
            <span class="text-gray-400">Reno, NV</span>. I have a passion for
            <span class="text-gray-400">learning</span>,
            <span class="text-gray-400">building</span>,
            <span class="text-gray-400">exploring</span>, and helping others
            succeed through <span class="text-gray-400">mentorship</span>.
          </p>
        </div>

        <div class="sm:w-1/4 mb-6 md:mb-0">
          <img src="/images/headshot.png" class="rounded-full" />
        </div>
      </div>

      <div>
        <a href="#contact" class="button" @click.prevent="scrollToContact"
          >Let's Chat</a
        >
      </div>
    </div>
  </div>
</template>
