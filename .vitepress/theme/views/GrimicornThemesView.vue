<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRevealAnimations } from "@composables/useRevealAnimations";
import GrimicornPreviewToggle from "@components/GrimicornPreviewToggle.vue";
import {
  HUES,
  BG_DARK,
  BG_LIGHT,
  TOOLS,
  PALETTE_HREF,
  ZIP_HREF,
} from "@data/grimicornTheme";
import type { GrimicornToolKind } from "@typedefs";

useRevealAnimations();

const STORAGE_KEY = "gc-preview";
const FLASH_MS = 1100;

const previewMode = ref<"dark" | "light">("dark");
const copiedIndex = ref<number | null>(null);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    previewMode.value = saved;
  }
});

watch(previewMode, (mode) => {
  localStorage.setItem(STORAGE_KEY, mode);
});

const isLight = computed(() => previewMode.value === "light");

const swatches = computed(() =>
  HUES.map((hue) => ({
    role: hue.role,
    usage: hue.usage,
    hex: isLight.value ? hue.light : hue.dark,
    other: isLight.value ? hue.dark : hue.light,
    otherLabel: isLight.value ? "dark" : "light",
  })),
);

const bgScale = computed(() => (isLight.value ? BG_LIGHT : BG_DARK));

function bgLabelColor(index: number): string {
  if (index < 3 && isLight.value) {
    return "#3C4C55";
  }
  if (index >= 2 && !isLight.value) {
    return "#E5E5E5";
  }
  return isLight.value ? "#3C4C55" : "#BFBFBF";
}

async function copyHex(hex: string, index: number) {
  try {
    await navigator.clipboard?.writeText(hex);
  } catch {
    // Clipboard blocked — still flash so the hex stays visible to copy by hand.
  }
  copiedIndex.value = index;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copiedIndex.value = null;
  }, FLASH_MS);
}

const TOOL_ICON_PATHS: Record<GrimicornToolKind, string> = {
  editor:
    '<path d="M3 3h12v10H3z" /><path d="M3 6h12" /><path d="M5.5 4.5h.01" />',
  terminal:
    '<path d="M3 3h12v10H3z" /><path d="M5.5 6.5l2 2-2 2" stroke-linejoin="round" /><path d="M9 10.5h3" />',
  git: '<circle cx="5" cy="5" r="1.6" /><circle cx="5" cy="13" r="1.6" /><circle cx="13" cy="9" r="1.6" /><path d="M5 6.6v4.8M6.5 5h4.4a1.6 1.6 0 0 1 1.6 1.6V8" />',
  notes:
    '<path d="M4 2.5h7L14 6v9.5H4z" /><path d="M11 2.5V6h3" /><path d="M6.5 9h5M6.5 11.5h5" />',
  agent:
    '<path d="M9 2.5l5 2.8v5.4L9 13.5 4 10.7V5.3z" stroke-linejoin="round" /><circle cx="9" cy="8" r="1.7" />',
  highlighter:
    '<path d="M6.5 6L3.5 9l3 3" stroke-linejoin="round" /><path d="M11.5 6l3 3-3 3" stroke-linejoin="round" /><path d="M10 4.5l-2 9" />',
};
</script>

<template>
  <div class="gc-scope" :data-gc="previewMode">
    <!-- HERO -->
    <section
      class="border-line bg-topography-edge relative overflow-hidden border-b px-8 pt-32 pb-16 max-md:px-4"
    >
      <div
        class="relative z-10 mx-auto grid max-w-[1180px] grid-cols-[0.92fr_1.08fr] items-center gap-14 max-lg:grid-cols-1 max-lg:gap-10"
      >
        <div>
          <div
            class="reveal text-fg-subtle mb-7 flex items-center gap-3 font-mono text-[0.68rem] tracking-[0.1em] uppercase"
          >
            <span class="bg-accent inline-block h-px w-6"></span>
            grim reaper × unicorn
          </div>
          <h1
            class="reveal mb-3 font-mono leading-[0.95] font-bold"
            style="
              font-size: clamp(2.8rem, 5.5vw, 4.6rem);
              letter-spacing: var(--tracking-tightest);
            "
          >
            Grimi<span class="text-outline inline-block">corn</span>
          </h1>
          <p
            class="reveal text-accent mb-6 font-mono text-[0.82rem] tracking-[0.02em]"
          >
            // a calm, low-fatigue color theme
          </p>
          <p
            class="reveal text-fg-muted mb-5 max-w-[460px] text-[1.02rem] leading-[1.75]"
          >
            Dead, dark, colorful and lively — all at once. A muted blue-gray
            base with soft pastel syntax, tuned over countless late nights so
            nothing on screen ever burns your eyes.
          </p>
          <p
            class="reveal text-fg-muted mb-8 max-w-[460px] text-[0.92rem] leading-[1.7]"
          >
            One palette, ported to everything I work in: VS Code, terminals,
            Obsidian, Claude Code &amp; more — each in matching
            <span class="text-fg">dark</span> and
            <span class="text-fg">light</span> variants.
          </p>
          <div class="reveal flex flex-wrap items-center gap-3">
            <a
              href="#tools"
              class="btn-base bg-accent border-accent hover:bg-accent-hover hover:border-accent-hover border-2 text-white hover:-translate-y-px"
            >
              browse &amp; download ↓
            </a>
            <a
              href="#palette"
              class="btn-base border-fg text-fg hover:bg-fg hover:text-bg border-2"
            >
              the palette
            </a>
          </div>
        </div>

        <!-- Featured live editor preview -->
        <div class="reveal-right">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div
              class="text-fg-subtle font-mono text-[0.62rem] tracking-[0.1em] uppercase"
            >
              live preview
            </div>
            <GrimicornPreviewToggle v-model="previewMode" />
          </div>
          <div class="gc-win">
            <div class="gc-titlebar">
              <span class="gc-dot" style="background: #dd9787"></span>
              <span class="gc-dot" style="background: #dada93"></span>
              <span class="gc-dot" style="background: #a9ce93"></span>
              <span class="gc-tab" style="margin-left: 0.6rem">theme.ts</span>
              <span class="gc-tab-dim">palette.ts</span>
              <span class="gc-chrome-label" style="margin-left: auto"
                >Grimicorn</span
              >
            </div>
            <div class="gc-code">
              <div class="gc-line">
                <span class="gc-ln">1</span
                ><span class="gc-src"
                  ><span class="t-com"
                    >// Grimicorn — calm by default</span
                  ></span
                >
              </div>
              <div class="gc-line">
                <span class="gc-ln">2</span
                ><span class="gc-src"
                  ><span class="t-key">import</span> { ref, computed }
                  <span class="t-key">from</span>
                  <span class="t-str">'vue'</span></span
                >
              </div>
              <div class="gc-line">
                <span class="gc-ln">3</span
                ><span class="gc-src"
                  ><span class="t-key">import type</span> {
                  <span class="t-type">Theme</span> }
                  <span class="t-key">from</span>
                  <span class="t-str">'./types'</span></span
                >
              </div>
              <div class="gc-line">
                <span class="gc-ln">4</span><span class="gc-src"> </span>
              </div>
              <div class="gc-line">
                <span class="gc-ln">5</span
                ><span class="gc-src"
                  ><span class="t-key">const</span> palette =
                  <span class="t-fn">ref</span>&lt;<span class="t-type"
                    >Theme</span
                  >&gt;(<span class="t-str">'dark'</span>)</span
                >
              </div>
              <div class="gc-line hl">
                <span class="gc-ln">6</span
                ><span class="gc-src"
                  ><span class="t-key">const</span> hues =
                  <span class="t-num">6</span> <span class="t-op">+</span>
                  <span class="t-num">2</span>
                  <span class="t-com">// 8 core roles</span></span
                >
              </div>
              <div class="gc-line">
                <span class="gc-ln">7</span><span class="gc-src"> </span>
              </div>
              <div class="gc-line">
                <span class="gc-ln">8</span
                ><span class="gc-src"
                  ><span class="t-key">export function</span>
                  <span class="t-fn">useTheme</span>(mode =
                  <span class="t-str">'auto'</span>) {</span
                >
              </div>
              <div class="gc-line">
                <span class="gc-ln">9</span
                ><span class="gc-src"
                  >&nbsp;&nbsp;<span class="t-key">const</span> isDark =
                  <span class="t-fn">computed</span>(()
                  <span class="t-op">=&gt;</span> mode
                  <span class="t-op">===</span>
                  <span class="t-str">'dark'</span>)</span
                >
              </div>
              <div class="gc-line">
                <span class="gc-ln">10</span
                ><span class="gc-src"
                  >&nbsp;&nbsp;<span class="t-key">return</span> {
                  <span class="t-prop">palette</span>,
                  <span class="t-prop">isDark</span> }</span
                >
              </div>
              <div class="gc-line">
                <span class="gc-ln">11</span><span class="gc-src">}</span>
              </div>
            </div>
          </div>
          <div
            class="text-fg-subtle mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[0.6rem]"
          >
            <span
              >// the toggle above re-themes every preview on this page</span
            >
            <span>VS Code · syntax</span>
          </div>
        </div>
      </div>
    </section>

    <!-- PALETTE -->
    <section id="palette" class="px-8 py-20 max-md:px-4">
      <div class="mx-auto max-w-[1180px]">
        <div class="accent-line mb-6"></div>
        <div
          class="grid grid-cols-[320px_1fr] items-start gap-16 max-lg:grid-cols-1 max-lg:gap-10"
        >
          <div class="reveal-left">
            <div
              class="text-fg-subtle mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.1em] uppercase"
            >
              <span class="bg-accent inline-block h-px w-6"></span>
              the color story
            </div>
            <h2
              class="mb-5 font-mono leading-[0.95] font-bold"
              style="
                font-size: clamp(1.6rem, 3vw, 2.2rem);
                letter-spacing: var(--tracking-tightest);
              "
            >
              Eight hues,<br />one feeling
            </h2>
            <p class="text-fg-muted mb-4 text-[0.92rem] leading-[1.75]">
              Nothing is saturated enough to cause fatigue. The dark variant
              rests on a muted blue-gray base; the light variant shifts the same
              roles toward ink-on-paper.
            </p>
            <p class="text-fg-muted mb-6 text-[0.92rem] leading-[1.75]">
              Accents follow a strict hierarchy —
              <span class="font-mono text-[0.85rem]" style="color: #83afe5"
                >blue</span
              >
              →
              <span class="font-mono text-[0.85rem]" style="color: #9a93e1"
                >purple</span
              >
              →
              <span class="font-mono text-[0.85rem]" style="color: #80c1ca"
                >teal</span
              >
              — and the semantic roles never drift: green is success, salmon is
              error, yellow is a type or a warning.
            </p>

            <div class="border-line flex items-center gap-4 border-t pt-6">
              <div
                class="border-line h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[6px] border shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                <img
                  src="/images/grimicorn-mascot.png"
                  alt="Grimicorn — a skeletal rainbow unicorn"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div class="text-fg-muted font-mono text-[0.68rem] leading-[1.7]">
                <div class="text-fg mb-0.5 text-[0.72rem] font-semibold">
                  Grimicorn
                </div>
                grim reaper <span class="text-accent">×</span> unicorn —<br />dead
                serious, secretly colorful.
              </div>
            </div>
          </div>

          <div>
            <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div
                class="text-fg-subtle font-mono text-[0.62rem] tracking-[0.1em] uppercase"
              >
                8 core roles · click any swatch to copy
              </div>
              <GrimicornPreviewToggle v-model="previewMode" />
            </div>
            <div class="stagger grid grid-cols-4 gap-3 max-md:grid-cols-2">
              <button
                v-for="(swatch, index) in swatches"
                :key="swatch.role"
                type="button"
                class="gc-swatch border-line bg-bg/50 hover:border-accent overflow-hidden rounded-[3px] border text-left transition-colors"
                :aria-label="`Copy ${swatch.role} ${swatch.hex}`"
                @click="copyHex(swatch.hex, index)"
              >
                <span
                  class="block h-14"
                  :style="{ background: swatch.hex }"
                ></span>
                <span class="block px-3 py-2.5">
                  <span class="flex items-center justify-between">
                    <span
                      class="text-fg font-mono text-[0.74rem] font-semibold"
                      >{{ swatch.role }}</span
                    >
                    <span
                      class="copy-hex text-fg-subtle font-mono text-[0.64rem] tracking-[0.02em]"
                      :class="{ 'copied-flash': copiedIndex === index }"
                      >{{
                        copiedIndex === index ? "copied!" : swatch.hex
                      }}</span
                    >
                  </span>
                  <span
                    class="text-fg-subtle mt-1 block font-mono text-[0.56rem] leading-[1.5]"
                    >{{ swatch.usage }}</span
                  >
                  <span
                    class="text-fg-subtle/80 mt-1.5 block font-mono text-[0.54rem]"
                    >{{ swatch.otherLabel }} · {{ swatch.other }}</span
                  >
                </span>
              </button>
            </div>

            <div class="mt-8">
              <div
                class="text-fg-subtle mb-3 font-mono text-[0.62rem] tracking-[0.1em] uppercase"
              >
                background scale
              </div>
              <div class="gc-win" style="box-shadow: none">
                <div class="flex" style="height: 64px">
                  <span
                    v-for="(color, index) in bgScale"
                    :key="`${color}-${index}`"
                    class="group relative flex-1"
                    :style="{ background: color }"
                    :title="color"
                  >
                    <span
                      class="absolute bottom-1 left-1.5 font-mono text-[0.5rem] tracking-[0.04em]"
                      :style="{ color: bgLabelColor(index) }"
                      >{{ color }}</span
                    >
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PREVIEWS -->
    <section
      class="bg-bg-soft border-line border-t border-b px-8 py-20 max-md:px-4"
    >
      <div class="mx-auto max-w-[1180px]">
        <div class="accent-line mb-6"></div>
        <div class="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              class="reveal text-fg-subtle mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.1em] uppercase"
            >
              <span class="bg-accent inline-block h-px w-6"></span>
              see it in action
            </div>
            <h2
              class="reveal mb-2 font-mono leading-none font-bold"
              style="
                font-size: clamp(1.6rem, 3vw, 2.2rem);
                letter-spacing: var(--tracking-tightest);
              "
            >
              Across the stack
            </h2>
            <p
              class="reveal text-fg-muted max-w-[460px] font-mono text-[0.72rem] leading-[1.7]"
            >
              Terminal ANSI, and the markdown heading waterfall — the same
              palette, everywhere.
            </p>
          </div>
          <GrimicornPreviewToggle v-model="previewMode" class="reveal" />
        </div>

        <div class="stagger grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          <!-- terminal -->
          <div>
            <div
              class="text-fg-subtle mb-2.5 font-mono text-[0.6rem] tracking-[0.1em] uppercase"
            >
              terminal · ANSI palette
            </div>
            <div class="gc-win">
              <div class="gc-titlebar">
                <span class="gc-dot" style="background: #dd9787"></span>
                <span class="gc-dot" style="background: #dada93"></span>
                <span class="gc-dot" style="background: #a9ce93"></span>
                <span class="gc-chrome-label" style="margin-left: 0.6rem"
                  >grimicorn — zsh — 96×24</span
                >
              </div>
              <div class="gc-term">
                <div>
                  <span class="u">grimicorn</span><span class="at">@</span
                  ><span class="path">dev</span>
                  <span class="pr">~/code %</span> git status
                </div>
                <div class="mut">
                  On branch <span class="info">main</span> · up to date with
                  <span class="path">origin/main</span>
                </div>
                <div style="height: 0.5rem"></div>
                <div class="mut">Changes to be committed:</div>
                <div>
                  &nbsp;&nbsp;<span class="ok">new file: src/palette.ts</span>
                </div>
                <div>
                  &nbsp;&nbsp;<span class="mod">modified: src/theme.ts</span>
                </div>
                <div>
                  &nbsp;&nbsp;<span class="del">deleted: src/legacy.css</span>
                </div>
                <div style="height: 0.5rem"></div>
                <div>
                  <span class="u">grimicorn</span><span class="at">@</span
                  ><span class="path">dev</span>
                  <span class="pr">~/code %</span> npm run build
                </div>
                <div>
                  <span class="ok">✓</span> built
                  <span class="info">14</span> modules in
                  <span class="info">1.24s</span>
                </div>
                <div>
                  <span class="u">grimicorn</span><span class="at">@</span
                  ><span class="path">dev</span>
                  <span class="pr">~/code %</span>
                  <span class="gc-cursor"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- markdown -->
          <div>
            <div
              class="text-fg-subtle mb-2.5 font-mono text-[0.6rem] tracking-[0.1em] uppercase"
            >
              markdown · heading waterfall
            </div>
            <div class="gc-win">
              <div class="gc-titlebar">
                <span class="gc-dot" style="background: #dd9787"></span>
                <span class="gc-dot" style="background: #dada93"></span>
                <span class="gc-dot" style="background: #a9ce93"></span>
                <span class="gc-chrome-label" style="margin-left: 0.6rem"
                  >notes.md — Obsidian</span
                >
              </div>
              <div class="gc-md">
                <div class="h1"># Grimicorn</div>
                <p>The grim reaper, reimagined as a <i>unicorn</i>.</p>
                <div class="h2">## Philosophy</div>
                <p>
                  Muted base, <b>pastel syntax</b>, nothing that
                  <i>burns the eyes</i>.
                </p>
                <div class="h3">### Accent order</div>
                <ul>
                  <li>Blue → Purple → Teal</li>
                  <li>Green = success, Salmon = error</li>
                </ul>
                <div class="h4">#### Heading four</div>
                <div class="h5">##### Heading five</div>
                <div class="h6">###### Heading six</div>
                <blockquote>
                  "Calm by default." — <code>const calm = true</code>
                </blockquote>
                <p><a href="#palette">Read the full palette →</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TOOLS / DOWNLOADS -->
    <section id="tools" class="px-8 py-20 max-md:px-4">
      <div class="mx-auto max-w-[1180px]">
        <div class="accent-line mb-6"></div>
        <div class="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              class="reveal text-fg-subtle mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.1em] uppercase"
            >
              <span class="bg-accent inline-block h-px w-6"></span>
              get the theme
            </div>
            <h2
              class="reveal mb-2 font-mono leading-none font-bold"
              style="
                font-size: clamp(1.6rem, 3vw, 2.2rem);
                letter-spacing: var(--tracking-tightest);
              "
            >
              Nine ports
            </h2>
            <p
              class="reveal text-fg-muted max-w-[480px] font-mono text-[0.72rem] leading-[1.7]"
            >
              Each tool ships a dark and a light file. Grab one, or take the
              whole set.
            </p>
          </div>
          <div class="reveal flex flex-wrap items-center gap-3">
            <a
              :href="PALETTE_HREF"
              download
              class="btn-base border-line text-fg hover:border-accent hover:text-accent inline-flex items-center gap-2 border"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 1v7M6 8L3.5 5.5M6 8l2.5-2.5M2 10.5h8"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              palette.md
            </a>
            <a
              :href="ZIP_HREF"
              download
              class="btn-base bg-accent border-accent hover:bg-accent-hover hover:border-accent-hover inline-flex items-center gap-2 border-2 text-white hover:-translate-y-px"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 1v7M6 8L3.5 5.5M6 8l2.5-2.5M2 10.5h8"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              download all (.zip)
            </a>
          </div>
        </div>

        <div
          class="stagger grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1"
        >
          <div
            v-for="tool in TOOLS"
            :key="tool.name"
            class="group flex flex-col border-t-2 pt-5"
            :class="tool.featured ? 'border-accent' : 'border-line'"
          >
            <div class="mb-2 flex items-start gap-3">
              <span class="text-accent mt-0.5 shrink-0">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  aria-hidden="true"
                  v-html="TOOL_ICON_PATHS[tool.kind]"
                ></svg>
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="tracking-tighter-2 text-fg font-mono text-[0.92rem] font-bold"
                    >{{ tool.name }}</span
                  >
                  <span
                    v-if="tool.featured"
                    class="text-accent bg-accent-dim rounded-[2px] px-1.5 py-px font-mono text-[0.54rem] tracking-[0.08em] uppercase"
                    >featured</span
                  >
                </div>
              </div>
            </div>
            <p
              class="text-fg-muted mb-4 min-h-[2.5rem] font-mono text-[0.66rem] leading-[1.6]"
            >
              {{ tool.desc }}
            </p>
            <div class="mb-3 flex gap-2">
              <a
                v-for="file in tool.files"
                :key="file.download"
                :href="file.href"
                :download="file.download"
                class="text-fg-muted border-line hover:border-accent hover:text-accent inline-flex min-w-[88px] flex-1 items-center justify-center gap-1.5 rounded-[2px] border px-2 py-2 text-center font-mono text-[0.66rem] no-underline transition-colors"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 1v7M6 8L3.5 5.5M6 8l2.5-2.5M2 10.5h8"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ file.label }}
              </a>
            </div>
            <details class="border-line/70 mt-auto border-t pt-2.5">
              <summary
                class="gc-summary text-fg-subtle hover:text-accent flex cursor-pointer items-center gap-1.5 font-mono text-[0.62rem] transition-colors select-none"
              >
                <svg
                  class="det-chevron transition-transform"
                  width="9"
                  height="9"
                  viewBox="0 0 10 10"
                  fill="none"
                >
                  <path
                    d="M3 2l4 3-4 3"
                    stroke="currentColor"
                    stroke-width="1.3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                how to install
              </summary>
              <p
                class="text-fg-muted mt-2.5 font-mono text-[0.6rem] leading-[1.7]"
                v-html="tool.install"
              ></p>
              <a
                :href="tool.docs"
                target="_blank"
                rel="noopener"
                class="text-accent mt-2 inline-flex items-center gap-1 font-mono text-[0.6rem] no-underline hover:underline"
                >docs ↗</a
              >
            </details>
          </div>
        </div>

        <p
          class="reveal text-fg-subtle mt-8 font-mono text-[0.62rem] tracking-[0.06em]"
        >
          // every file is generated from a single source of truth —
          <a :href="PALETTE_HREF" download class="text-accent no-underline"
            >grimicorn-palette.md</a
          >
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Grimicorn preview palette — independent of the site's dark/light theme. */
.gc-scope[data-gc="dark"] {
  --gc-editor: #3c4c55;
  --gc-sidebar: #2e3c44;
  --gc-deep: #253039;
  --gc-fg: #e5e5e5;
  --gc-muted: #bfbfbf;
  --gc-faint: #6b7880;
  --gc-blue: #83afe5;
  --gc-purple: #9a93e1;
  --gc-green: #a9ce93;
  --gc-teal: #80c1ca;
  --gc-yellow: #dada93;
  --gc-salmon: #dd9787;
  --gc-line-hl: #445060;
  --gc-border: #1e2a31;
}
.gc-scope[data-gc="light"] {
  --gc-editor: #fdfdfd;
  --gc-sidebar: #f0f0f0;
  --gc-deep: #e4e4e4;
  --gc-fg: #1a262c;
  --gc-muted: #3c4c55;
  --gc-faint: #8a96a0;
  --gc-blue: #4a80c8;
  --gc-purple: #6b63c8;
  --gc-green: #2e7d32;
  --gc-teal: #3a8e96;
  --gc-yellow: #8a8a20;
  --gc-salmon: #c4604e;
  --gc-line-hl: #ebebeb;
  --gc-border: #d0d0d0;
}

.gc-win {
  overflow: hidden;
  border: 1px solid var(--gc-border);
  border-radius: 10px;
  background: var(--gc-editor);
  font-family: var(--font-mono);
  box-shadow:
    0 30px 70px rgba(15, 22, 28, 0.3),
    0 4px 16px rgba(15, 22, 28, 0.16);
  transition:
    background 0.4s ease,
    border-color 0.4s ease;
}
.gc-titlebar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.95rem;
  background: var(--gc-deep);
  border-bottom: 1px solid var(--gc-border);
  transition: background 0.4s ease;
}
.gc-dot {
  display: inline-block;
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.gc-tab {
  padding: 0.2rem 0.7rem;
  border-radius: 4px 4px 0 0;
  border-top: 2px solid var(--gc-blue);
  background: var(--gc-editor);
  color: var(--gc-fg);
  font-size: 11.5px;
}
.gc-tab-dim {
  padding: 0.2rem 0.6rem;
  color: var(--gc-faint);
  font-size: 11.5px;
}
.gc-chrome-label {
  color: var(--gc-muted);
  font-size: 11.5px;
}

.gc-code {
  padding: 1.1rem 0.4rem 1.3rem 0;
  overflow-x: auto;
  color: var(--gc-fg);
  font-size: 13.5px;
  line-height: 1.9;
}
.gc-line {
  display: flex;
  align-items: baseline;
  padding: 0 1.1rem;
  white-space: pre;
}
.gc-line.hl {
  background: var(--gc-line-hl);
}
.gc-ln {
  width: 2.1rem;
  flex-shrink: 0;
  padding-right: 1.1rem;
  color: var(--gc-faint);
  font-size: 12px;
  text-align: right;
  user-select: none;
}
.gc-src {
  color: var(--gc-fg);
}
.t-key {
  color: var(--gc-blue);
}
.t-fn {
  color: var(--gc-purple);
}
.t-str {
  color: var(--gc-green);
}
.t-type {
  color: var(--gc-yellow);
}
.t-num {
  color: var(--gc-teal);
}
.t-prop {
  color: var(--gc-teal);
}
.t-com {
  color: var(--gc-muted);
  font-style: italic;
}
.t-op {
  color: var(--gc-blue);
}

/* terminal */
.gc-term {
  padding: 1.1rem 1.3rem;
  overflow-x: auto;
  background: var(--gc-sidebar);
  color: var(--gc-fg);
  font-size: 13px;
  line-height: 1.95;
}
.gc-term .u {
  color: var(--gc-green);
}
.gc-term .at {
  color: var(--gc-faint);
}
.gc-term .path {
  color: var(--gc-blue);
}
.gc-term .pr {
  color: var(--gc-faint);
}
.gc-term .ok {
  color: var(--gc-green);
}
.gc-term .mod {
  color: var(--gc-yellow);
}
.gc-term .del {
  color: var(--gc-salmon);
}
.gc-term .info {
  color: var(--gc-teal);
}
.gc-term .mut {
  color: var(--gc-muted);
}
.gc-cursor {
  display: inline-block;
  width: 8px;
  height: 15px;
  background: var(--gc-green);
  vertical-align: -2px;
  animation: gc-blink 1.1s step-end infinite;
}
@keyframes gc-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

/* markdown */
.gc-md {
  padding: 1.6rem 1.8rem;
  background: var(--gc-editor);
  color: var(--gc-fg);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.7;
}
.gc-md .h1 {
  margin: 0 0 0.2rem;
  color: var(--gc-blue);
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.gc-md .h2 {
  margin: 1.1rem 0 0.3rem;
  color: var(--gc-purple);
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 700;
}
.gc-md .h3 {
  margin: 0.9rem 0 0.3rem;
  color: var(--gc-teal);
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
}
.gc-md .h4 {
  margin: 0.8rem 0 0.2rem;
  color: var(--gc-green);
  font-family: var(--font-mono);
  font-size: 0.92rem;
  font-weight: 600;
}
.gc-md .h5 {
  margin: 0.7rem 0 0.2rem;
  color: var(--gc-yellow);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 600;
}
.gc-md .h6 {
  margin: 0.6rem 0 0.2rem;
  color: var(--gc-muted);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.gc-md p {
  margin: 0.4rem 0;
  color: var(--gc-fg);
}
.gc-md b {
  color: var(--gc-yellow);
  font-weight: 700;
}
.gc-md i {
  color: var(--gc-purple);
  font-style: italic;
}
.gc-md a {
  color: var(--gc-blue);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.gc-md code {
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  background: var(--gc-deep);
  color: var(--gc-teal);
  font-family: var(--font-mono);
  font-size: 0.85em;
}
.gc-md blockquote {
  margin: 0.6rem 0;
  padding: 0.1rem 0 0.1rem 0.9rem;
  border-left: 3px solid var(--gc-blue);
  color: var(--gc-muted);
  font-style: italic;
}
.gc-md ul {
  margin: 0.4rem 0;
  padding-left: 1.1rem;
}
.gc-md li {
  margin: 0.15rem 0;
}
.gc-md li::marker {
  color: var(--gc-teal);
}

/* palette swatch */
.gc-swatch {
  cursor: pointer;
}
.gc-swatch:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.copied-flash {
  color: var(--color-accent) !important;
}

/* install disclosure */
.gc-summary {
  list-style: none;
}
.gc-summary::-webkit-details-marker {
  display: none;
}
details[open] .det-chevron {
  transform: rotate(90deg);
}

@media (prefers-reduced-motion: reduce) {
  .gc-cursor {
    animation: none;
  }
}
</style>
