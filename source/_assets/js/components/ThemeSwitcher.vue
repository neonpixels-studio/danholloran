<template>
  <div class="flex items-center justify-center">
    <button
      class="button button-link"
      type="button"
      @click="() => displaySelect = !displaySelect"
      v-show="!displaySelect"
    >Change Theme</button>

    <div v-show="displaySelect">
      <label
        for="theme_switcher"
        class="sr-only"
      >Theme</label>
      <div class="bg-white">
        <select
          @input="handleInput"
          class="h-full"
          name="theme_switcher"
          id="theme_switcher"
        >
          <option
            :value="option.value"
            v-for="option in themeOptions"
            :key="option.value"
            v-text="option.label"
          ></option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import { themes, setTheme, themeOptions, getTheme } from "../theme";

export default {
  data() {
    return {
      theme: getTheme(),
      displaySelect: false,
      themes,
      themeOptions
    };
  },
  methods: {
    setTheme() {
      return setTheme(this.theme);
    },

    handleInput(e) {
      this.theme = e.target.value;
      this.displaySelect = !this.displaySelect;
    }
  },

  watch: {
    theme(value) {
      setTheme(this.theme);
    }
  },

  mounted() {
    setTheme(this.theme);
  }
};
</script>

<style>
</style>
