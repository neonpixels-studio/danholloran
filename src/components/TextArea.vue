<script setup>
import BaseInput, { propsDefinition } from "@/components/BaseInput.vue";
import { ref, watch } from "vue";
import debounce from "lodash.debounce";

const props = defineProps({
  ...propsDefinition,

  rows: {
    type: Number,
    default: 8,
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

<template>
  <BaseInput v-bind="props" class="multi-select-input" v-model="value">
    <template v-slot="{ inputAttributes, inputClass }">
      <textarea
        v-model="value"
        :name="name"
        :rows="rows"
        :placeholder="label"
        :class="inputClass"
        v-bind="inputAttributes"
        class="w-full rounded-xl px-6 py-6 leading-tight font-bold resize-y text-black dark:text-white dark:bg-black"
      />
    </template>
  </BaseInput>
</template>
