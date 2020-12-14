<style scoped>
    svg {
        height: .9em;
        width: auto;
        max-height: 100%;
    }

    button {
        cursor: pointer;
    }
</style>
<template>
    <button
        class="flex items-center"
        type="button"
        @click.prevent="handleClick"
        :disabled="copied"
        ref="button"
        :data-clipboard-text="dataText"
        :title="label"
    >
      <span
        :class="{
            'text-green-500': this.copied,
            'mr-2': !this.slotEmpty
        }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
        </svg>
      </span>
      <slot></slot>
      <span class="sr-only" v-text="label" v-if="slotEmpty"></span>
    </button>
</template>

<script>
import ClipboardJS from 'clipboard'

export default {
    props: {
        dataText: {
            type: String,
            required: true,
        },
        dataLabel: {
            type: String,
        }
    },

    data() {
        return {
            copied: false,
            clipboard: undefined
        };
    },

    computed: {
        iconName() {
            return this.copied ? 'checkmark' : 'edit-copy';
        },
        label() {
            return this.dataLabel ? this.dataLabel : `Copy "${this.dataText}" to clipboard`
        },
        slotEmpty() {
            return this.$slots.default === undefined;
        }
    },

    methods: {
        handleClick() {
            if (!this.clipboard || this.copied) {
                return;
            }

            this.clipboard.on('success', (e) => {
                this.copied = true;
                setTimeout(() => this.copied = false, 2000);
                e.clearSelection();
            })

        }
    },

    mounted() {
        this.clipboard = new ClipboardJS(this.$refs['button']);
    }
};
</script>
