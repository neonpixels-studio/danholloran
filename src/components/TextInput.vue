<script setup>
import BaseInput, { propsDefinition } from "@/components/BaseInput.vue";
import { ref, watch } from "vue";
import debounce from "lodash.debounce";

const props = defineProps({
  ...propsDefinition,

  type: {
    type: [String],
    default: "text",
    validation(value) {
      return validTextInputTypes.includes(value);
    },
  },
});

const emit = defineEmits(["update:modelValue"]);

const updateModelValue = debounce((newValue, oldValue) => {
  emit("update:modelValue", newValue, oldValue);
}, props.delay);

// == Model Value =======================================
const value = ref(props.modelValue);
watch(
  () => props.modelValue,
  (newValue) => {
    value.value = newValue;
  },
);
watch(value, updateModelValue);
</script>

<script>
export const validTextInputTypes = [
  "button",
  "checkbox",
  "color",
  "date",
  "datetime-local",
  "email",
  "file",
  "hidden",
  "image",
  "month",
  "number",
  "password",
  "radio",
  "range",
  "reset",
  "search",
  "submit",
  "tel",
  "text",
  "time",
  "url",
  "week",
];
</script>

<template>
  <BaseInput v-bind="props" class="multi-select-input" v-model="value">
    <template v-slot="{ inputAttributes, inputClass }">
      <input
        v-model="value"
        :name="name"
        :type="type"
        :placeholder="label"
        :class="inputClass"
        v-bind="inputAttributes"
        class="w-full rounded-xl px-6 py-6 leading-tight font-bold text-black dark:text-white dark:bg-black"
      />
    </template>
  </BaseInput>
</template>
