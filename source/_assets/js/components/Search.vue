<template hidden>
  <div class="flex justify-end items-center text-right w-full">
    <div class="relative w-full justify-end flex">
      <label for="search" class="sr-only">Search</label>

      <input
        id="search"
        v-model="query"
        ref="search"
        class="transition-fast relative block h-10 w-full lg:w-64 lg:focus:w-2/3 bg-gray-100 border border-gray-500 focus:border-primary-400 outline-none cursor-pointer text-gray-700 px-4 pb-0 pt-px max-w-full"
        :class="{ 'transition-border': query }"
        autocomplete="off"
        name="search"
        placeholder="Search"
        type="text"
        @keyup.esc="reset"
        @blur="reset"
      />

      <transition name="fade">
        <div
          v-if="query"
          class="absolute left-0 right-0 md:inset-auto text-left mt-10 w-full"
        >
          <div
            class="flex flex-col bg-white border border-b-0 border-t-0 border-primary-400 rounded-b-lg shadow-lg mx-0"
          >
            <a
              v-for="(result, index) in results"
              class="bg-white hover:bg-primary-100 border-b border-primary-400 text-xl cursor-pointer p-4"
              :class="{ 'rounded-b-lg': index === results.length - 1 }"
              :href="result.link"
              :title="result.title"
              :key="result.link"
              @mousedown.prevent
            >
              {{ result.title }}

              <span
                class="block font-normal text-gray-700 text-sm my-1"
                v-html="result.snippet"
              ></span>
            </a>

            <div
              v-if="!results.length"
              class="bg-white w-full hover:bg-primary-100 border-b border-primary-400 rounded-b-lg shadow cursor-pointer p-4"
            >
              <p class="my-0">
                No results for <strong>{{ query }}</strong>
              </p>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      fuse: null,
      searching: false,
      query: ""
    };
  },
  computed: {
    results() {
      return this.query ? this.fuse.search(this.query) : [];
    }
  },
  methods: {
    showInput() {
      this.searching = true;
      this.$nextTick(() => {
        this.$refs.search.focus();
      });
    },
    reset() {
      this.query = "";
      this.searching = false;
    }
  },
  created() {
    axios("/index.json").then(response => {
      this.fuse = new fuse(response.data, {
        minMatchCharLength: 6,
        keys: ["title", "snippet", "categories"]
      });
    });
  }
};
</script>

<style>
input[name="search"] {
  background-image: url("/assets/img/magnifying-glass.svg");
  background-position: 0.8em;
  background-repeat: no-repeat;
  border-radius: 25px;
  text-indent: 1.2em;
}

input[name="search"].transition-border {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.fade-enter-active {
  transition: opacity 0.5s;
}

.fade-leave-active {
  transition: opacity 0s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
