<script setup>
import {
  InformationCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/vue/20/solid";
import { useAttrs, ref, watch, onMounted, nextTick, computed } from "vue";

const props = defineProps({
  ...propsDefinition,
  options: {
    type: Array,
    default() {
      return [];
    },
  },
});
const emit = defineEmits(["update:modelValue", "edited"]);
const $wrapper = ref(null);

// == Model Value =======================================
const initialValueSet = ref(false);
const value = ref(null);
watch(
  () => props.modelValue,
  (newValue) => {
    value.value = newValue;
  },
);
watch(value, (newValue, oldValue) => {
  emit("update:modelValue", newValue, oldValue);
});

// == Edit Togglable =======================================
const canEdit = ref(props.editTogglable ? false : true);
const originalValue = ref(props.modelValue);
const editLabel = computed(() => {
  return canEdit.value ? "Cancel" : "Edit";
});
const startEdit = () => {
  if (!props.editTogglable) {
    return;
  }

  originalValue.value = props.modelValue;
  canEdit.value = !canEdit.value;
  $wrapper.value?.querySelector("input,select,textarea")?.focus();
};

const cancelEdit = () => {
  if (!props.editTogglable) {
    return;
  }

  value.value = originalValue.value;
  canEdit.value = !canEdit.value;
};
const toggleEdit = () => {
  if (!props.editTogglable) {
    return;
  }

  return canEdit.value ? cancelEdit() : startEdit();
};

const saveEdit = () => {
  if (!props.editTogglable) {
    return;
  }

  originalValue.value = value.value;
  emit("edited", originalValue.value);
  canEdit.value = false;
};

// == Attributes =======================================
const attributes = useAttrs();
const inputAttributes = computed(() => {
  const _inputAttributes = [];
  Object.entries(attributes).forEach(([key, value]) => {
    const ignored = ["class", "style"];
    if (ignored.includes(key)) {
      return;
    }

    _inputAttributes[key] = value;
  });

  if (props.editTogglable) {
    _inputAttributes.readonly = !canEdit.value;
  }

  return _inputAttributes;
});

// == Setup =======================================
onMounted(() => {
  value.value = props.modelValue;
  nextTick(() => {
    initialValueSet.value = true;
  });
});
</script>

<script>
export default {
  inheritAttrs: false,
};

export const propsDefinition = {
  modelValue: {
    type: [Array, String, Object],
    default: null,
  },

  name: {
    type: String,
    required: true,
  },

  inputClass: {
    type: [String, Array, Object],
    default: undefined,
  },

  label: {
    type: String,
    required: true,
  },

  labelVisible: {
    type: Boolean,
    default: false,
  },

  errorMessage: {
    type: String,
    default: "",
  },

  message: {
    type: String,
    default: "",
  },

  inline: {
    type: Boolean,
    default: false,
  },

  editTogglable: {
    type: Boolean,
  },

  delay: {
    type: Number,
    default: 500,
  },
};
</script>

<template>
  <div
    class="w-full"
    :class="[attributes.class, errorMessage ? 'has-error' : '']"
    :style="attributes.style"
    ref="$wrapper"
  >
    <div
      class="w-full relative"
      :class="{
        'flex items-center': inline,
      }"
    >
      <label
        :for="name"
        :class="{
          'sr-only': !labelVisible && !value && !inline,
          'text-white absolute top-0 z-10 -mt-2 ml-6': !labelVisible && !!value,
          block: labelVisible && !inline,
          'text-danger-500': !!errorMessage,
          'mr-6': inline,
          'mb-2': !inline,
        }"
        v-text="label"
        class="font-bold text-lg leading-none"
      ></label>

      <div class="w-full flex">
        <div class="relative flex-1">
          <!-- Input Slot -->
          <slot
            v-bind="props"
            :inputAttributes="inputAttributes"
            :props="props"
          ></slot>

          <!-- Editable Edit/Cancel Button -->
          <button
            v-if="editTogglable"
            type="button"
            class="absolute top-o bottom-0 right-0 flex items-center justify-end h-full font-bold text-xs px-4"
            @click="toggleEdit"
            v-text="editLabel"
            :class="{
              'text-gray-500 left-0 w-full': !canEdit,
              'text-gray-400': canEdit,
            }"
          ></button>
        </div>

        <div v-if="editTogglable && canEdit" class="ml-2">
          <button type="button" class="button h-full" @click="saveEdit">
            Save
          </button>
        </div>
      </div>
    </div>
    <div v-if="message" class="mt-1 flex items-center text-gray-500">
      <InformationCircleIcon class="mr-1 h-4 w-4" /> {{ message }}
    </div>
    <div v-if="errorMessage" class="mt-1 flex items-center text-danger-500">
      <ExclamationCircleIcon class="mr-1 h-4 w-4" /> {{ errorMessage }}
    </div>
  </div>
</template>
