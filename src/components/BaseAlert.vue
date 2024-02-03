<script setup>
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/vue/24/solid";
import { computed, ref } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: "info",
    validator(value) {
      return ["warning", "success", "info", "danger"].includes(value);
    },
  },

  title: {
    type: String,
    default: "",
  },

  link: {
    type: String,
    default: "",
  },

  linkLabel: {
    type: String,
    default: "",
  },

  dismissible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["dismissed"]);

const classes = computed(() => {
  if (props.type === "warning") {
    return {
      title: "text-warning-800",
      content: "text-warning-700",
      link: props.dismissible
        ? "warning"
        : "text-warning-700 hover:text-warning-600",
      container: "bg-warning-50",
      icon: "w-5 h-5 text-warning-400",
      dimiss:
        "bg-warning-50 text-warning-500 hover:bg-warning-100 focus:ring-warning-600 focus:ring-offset-warning-50",
    };
  }

  if (props.type === "danger") {
    return {
      title: "text-danger-800",
      content: "text-danger-700",
      link: props.dismissible
        ? "danger"
        : "text-danger-700 hover:text-danger-600",
      container: "bg-danger-50",
      icon: "w-5 h-5 text-danger-400",
      dimiss:
        "bg-danger-50 text-danger-500 hover:bg-danger-100 focus:ring-danger-600 focus:ring-offset-danger-50",
    };
  }

  if (props.type === "success") {
    return {
      title: "text-success-800",
      content: "text-success-700",
      link: props.dismissible
        ? "success"
        : "text-success-700 hover:text-success-600",
      container: "bg-success-50",
      icon: "w-5 h-5 text-success-400",
      dimiss:
        "bg-success-50 text-success-500 hover:bg-success-100 focus:ring-success-600 focus:ring-offset-success-50",
    };
  }

  return {
    title: "text-info-800",
    content: "text-info-700",
    link: props.dismissible
      ? "text-info-700"
      : "text-info-700 hover:text-info-600",
    container: "bg-info-50",
    icon: "w-5 h-5 text-info-400",
    dimiss:
      "bg-info-50 text-info-500 hover:bg-info-100 focus:ring-info-600 focus:ring-offset-info-50",
  };
});

const iconComponent = computed(() => {
  if (props.type === "warning") {
    return ExclamationCircleIcon;
  }

  if (props.type === "danger") {
    return XCircleIcon;
  }

  if (props.type === "success") {
    return CheckCircleIcon;
  }

  return InformationCircleIcon;
});

// == Dimsiss =======================================
const dismissed = ref(false);
const handleDismiss = () => {
  dismissed.value = true;
  emit("dismissed");
};
</script>

<template>
  <transition name="fadeHeight">
    <div v-if="!dismissed" class="rounded-md p-4" :class="classes.container">
      <div class="flex">
        <div
          v-if="iconComponent"
          class="flex-shrink-0"
          :class="{
            'flex items-center': !title,
          }"
        >
          <component
            :is="iconComponent"
            aria-hidden="true"
            :class="classes.icon"
          />
        </div>
        <div class="ml-3 flex flex-1 items-center">
          <div>
            <h3
              v-if="title"
              class="mb-2 mt-0 font-medium leading-none"
              :class="classes.title"
              v-text="title"
            ></h3>
            <div :class="classes.content">
              <slot></slot>
            </div>
            <div v-if="link && linkLabel && dismissible" class="mt-2">
              <a
                :href="link"
                class="whitespace-nowrap font-medium"
                :class="classes.link"
              >
                {{ linkLabel }}&nbsp;<span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <div v-if="link && linkLabel && !dismissible" class="ml-auto">
            <a
              :href="link"
              class="whitespace-nowrap font-medium"
              :class="classes.link"
            >
              {{ linkLabel }}&nbsp;<span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div v-if="dismissible" class="ml-auto">
            <button
              type="button"
              class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="classes.dimiss"
              @click="handleDismiss"
            >
              <span class="sr-only">Dismiss</span>
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
<style scoped>
.fadeHeight-enter-active,
.fadeHeight-leave-active {
  transition: all 0.3s;
  max-height: 200px;
}
.fadeHeight-enter,
.fadeHeight-leave-to {
  opacity: 0;
  max-height: 0px;
}
</style>
