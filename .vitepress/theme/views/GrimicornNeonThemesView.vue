<script setup lang="ts">
import { computed, ref } from "vue";
import { useRevealAnimations } from "@composables/useRevealAnimations";
import {
  NEON_HUES,
  NEON_BG,
  NEON_RAINBOW,
  NEON_TOOLS,
  NEON_PALETTE_HREF,
  NEON_ZIP_HREF,
} from "@data/grimicornNeonTheme";
import type { GrimicornToolKind } from "@typedefs";

useRevealAnimations();

const FLASH_MS = 1100;
const copiedIndex = ref<number | null>(null);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

// The rainbow stops, looped back to the first so the pan animation is seamless.
const rainbowGradient = `linear-gradient(90deg, ${[...NEON_RAINBOW, NEON_RAINBOW[0]].join(", ")})`;

const sortedTools = computed(() =>
  [...NEON_TOOLS].sort((a, b) => {
    const byFeatured =
      Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (byFeatured !== 0) {
      return byFeatured;
    }
    return a.name.localeCompare(b.name);
  }),
);

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
  <div class="n-scope">
    <!-- HERO -->
    <section
      class="n-hero relative overflow-hidden px-8 pt-32 pb-20 max-md:px-4"
    >
      <div class="n-hero-glow" aria-hidden="true"></div>
      <div
        class="relative z-10 mx-auto grid max-w-[1180px] grid-cols-[0.92fr_1.08fr] items-center gap-14 max-lg:grid-cols-1 max-lg:gap-10"
      >
        <div>
          <div
            class="reveal mb-7 flex items-center gap-3 font-mono text-[0.68rem] tracking-[0.1em] uppercase"
            style="color: #a7a39c"
          >
            <span class="n-rave-dot"></span>
            rave mode: always on
          </div>
          <h1
            class="reveal n-rainbow mb-4 font-mono leading-[0.92] font-bold"
            :style="{
              backgroundImage: rainbowGradient,
              fontSize: 'clamp(2.8rem, 6vw, 5rem)',
              letterSpacing: 'var(--tracking-tightest)',
            }"
          >
            Grimicorn Neon
          </h1>
          <p
            class="reveal mb-6 font-mono text-[0.9rem]"
            style="
              color: #22d3ee;
              text-shadow: 0 0 18px rgba(34, 211, 238, 0.5);
            "
          >
            // the grim reaper × unicorn, plugged into the mains
          </p>
          <p
            class="reveal mb-8 max-w-[520px] text-[1.02rem] leading-[1.75]"
            style="color: #a7a39c"
          >
            Same hue roles as
            <a class="n-link" href="/themes/grimicorn">calm Grimicorn</a>,
            cranked to electric values pulled from
            <a class="n-link" href="https://grimicorn.dev" target="_blank"
              >grimicorn.dev</a
            >. Saturated, glowing accents on a near-black base — dark-only, loud
            by design.
          </p>
          <div class="reveal flex flex-wrap items-center gap-3">
            <a
              href="#neon-tools"
              class="n-btn n-btn-rainbow"
              :style="{ backgroundImage: rainbowGradient }"
            >
              grab the theme ↓
            </a>
            <a href="/themes/grimicorn" class="n-btn n-btn-ghost">
              back to calm →
            </a>
          </div>
        </div>

        <!-- live editor preview -->
        <div class="reveal-right">
          <div
            class="mb-3 font-mono text-[0.62rem] tracking-[0.1em] uppercase"
            style="color: #75726b"
          >
            VS Code · syntax
          </div>
          <div class="n-win">
            <div class="n-titlebar">
              <span class="n-dot" style="background: #ff2d9b"></span>
              <span class="n-dot" style="background: #facc15"></span>
              <span class="n-dot" style="background: #a3e635"></span>
              <span
                style="margin-left: 0.6rem; color: #a7a39c; font-size: 11.5px"
                >theme.ts</span
              >
              <span style="margin-left: auto; color: #75726b; font-size: 11.5px"
                >Grimicorn Neon</span
              >
            </div>
            <div class="n-code">
              <div class="n-line">
                <span class="n-ln">1</span>
                <span class="n-src"
                  ><span class="n-com"
                    >// Grimicorn Neon — loud by default</span
                  ></span
                >
              </div>
              <div class="n-line">
                <span class="n-ln">2</span>
                <span class="n-src"
                  ><span class="n-key">import</span> { ref, computed }
                  <span class="n-key">from</span>
                  <span class="n-str">'vue'</span></span
                >
              </div>
              <div class="n-line">
                <span class="n-ln">3</span>
                <span class="n-src"
                  ><span class="n-key">import type</span> {
                  <span class="n-type">Theme</span> }
                  <span class="n-key">from</span>
                  <span class="n-str">'./types'</span></span
                >
              </div>
              <div class="n-line">
                <span class="n-ln">4</span>
                <span class="n-src"></span>
              </div>
              <div class="n-line">
                <span class="n-ln">5</span>
                <span class="n-src"
                  ><span class="n-key">const</span> palette =
                  <span class="n-fn">ref</span>&lt;<span class="n-type"
                    >Theme</span
                  >&gt;(<span class="n-str">'neon'</span>)</span
                >
              </div>
              <div class="n-line hl">
                <span class="n-ln">6</span>
                <span class="n-src"
                  ><span class="n-key">const</span> hues =
                  <span class="n-num">6</span> <span class="n-op">+</span>
                  <span class="n-num">2</span>
                  <span class="n-com"> // 8 charged roles</span></span
                >
              </div>
              <div class="n-line">
                <span class="n-ln">7</span>
                <span class="n-src"></span>
              </div>
              <div class="n-line">
                <span class="n-ln">8</span>
                <span class="n-src"
                  ><span class="n-key">export function</span>
                  <span class="n-fn">useTheme</span>(mode =
                  <span class="n-str">'rave'</span>) {</span
                >
              </div>
              <div class="n-line">
                <span class="n-ln">9</span>
                <span class="n-src"
                  >&nbsp;&nbsp;<span class="n-key">const</span> isRave =
                  <span class="n-fn">computed</span>(()
                  <span class="n-op">=&gt;</span> mode
                  <span class="n-op">===</span>
                  <span class="n-str">'rave'</span>)</span
                >
              </div>
              <div class="n-line">
                <span class="n-ln">10</span>
                <span class="n-src"
                  >&nbsp;&nbsp;<span class="n-key">return</span> {
                  <span class="n-prop">palette</span>,
                  <span class="n-prop">isRave</span> }</span
                >
              </div>
              <div class="n-line">
                <span class="n-ln">11</span>
                <span class="n-src">}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PALETTE -->
    <section
      id="neon-palette"
      class="border-t px-8 py-20 max-md:px-4"
      style="border-color: #1c1c20"
    >
      <div class="mx-auto max-w-[1180px]">
        <div class="mb-10">
          <div
            class="reveal mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.1em] uppercase"
            style="color: #a7a39c"
          >
            <span class="n-bar"></span>
            the palette
          </div>
          <h2
            class="reveal mb-2 font-mono leading-none font-bold"
            style="font-size: clamp(1.6rem, 3vw, 2.2rem); color: #e7e5e4"
          >
            Eight hues, fully charged
          </h2>
          <p
            class="reveal max-w-[460px] font-mono text-[0.72rem] leading-[1.7]"
            style="color: #a7a39c"
          >
            Click any swatch to copy its hex.
          </p>
        </div>

        <div class="stagger grid grid-cols-4 gap-4 max-md:grid-cols-2">
          <button
            v-for="(hue, index) in NEON_HUES"
            :key="hue.role"
            class="n-swatch group flex flex-col rounded-[6px] border p-4 text-left"
            :style="{ borderColor: '#1c1c20' }"
            @click="copyHex(hue.hex, index)"
          >
            <span
              class="n-chip mb-3 h-12 w-full rounded-[4px]"
              :style="{
                background: hue.hex,
                boxShadow: `0 0 22px ${hue.hex}66`,
              }"
            ></span>
            <span
              class="font-mono text-[0.82rem] font-bold"
              style="color: #e7e5e4"
              >{{ hue.role }}</span
            >
            <span class="font-mono text-[0.62rem]" :style="{ color: hue.hex }">
              {{ copiedIndex === index ? "copied!" : hue.hex }}
            </span>
            <span
              class="mt-1 font-mono text-[0.58rem] leading-[1.5]"
              style="color: #75726b"
              >{{ hue.usage }}</span
            >
          </button>
        </div>

        <!-- background scale -->
        <div
          class="reveal mt-8 flex overflow-hidden rounded-[6px] border"
          style="border-color: #1c1c20"
        >
          <div
            v-for="bg in NEON_BG"
            :key="bg"
            class="flex h-12 flex-1 items-center justify-center font-mono text-[0.55rem]"
            :style="{ background: bg, color: '#75726b' }"
          >
            {{ bg }}
          </div>
        </div>
      </div>
    </section>

    <!-- PREVIEW -->
    <section
      class="border-t px-8 py-20 max-md:px-4"
      style="border-color: #1c1c20"
    >
      <div class="mx-auto max-w-[1180px]">
        <div class="mb-10">
          <div
            class="reveal mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.1em] uppercase"
            style="color: #a7a39c"
          >
            <span class="n-bar"></span>
            see it glow
          </div>
          <h2
            class="reveal mb-2 font-mono leading-none font-bold"
            style="font-size: clamp(1.6rem, 3vw, 2.2rem); color: #e7e5e4"
          >
            Across the stack
          </h2>
        </div>

        <div class="stagger grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          <!-- terminal + git diff, stacked in the left column -->
          <div class="flex flex-col gap-6">
            <!-- terminal -->
            <div>
              <div
                class="mb-2.5 font-mono text-[0.6rem] tracking-[0.1em] uppercase"
                style="color: #75726b"
              >
                terminal · ANSI palette
              </div>
              <div class="n-win">
                <div class="n-titlebar">
                  <span class="n-dot" style="background: #ff2d9b"></span>
                  <span class="n-dot" style="background: #facc15"></span>
                  <span class="n-dot" style="background: #a3e635"></span>
                  <span
                    style="
                      margin-left: 0.6rem;
                      color: #a7a39c;
                      font-size: 11.5px;
                    "
                    >grimicorn — zsh — 96×24</span
                  >
                </div>
                <div class="n-term">
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
                    &nbsp;&nbsp;<span class="ok">new file: src/neon.ts</span>
                  </div>
                  <div>
                    &nbsp;&nbsp;<span class="mod">modified: theme.ts</span>
                  </div>
                  <div>
                    &nbsp;&nbsp;<span class="del">deleted: calm.css</span>
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
                    <span class="info">0.92s</span>
                  </div>
                  <div>
                    <span class="u">grimicorn</span><span class="at">@</span
                    ><span class="path">dev</span>
                    <span class="pr">~/code %</span>
                    <span class="n-cursor"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- git diff (Git Tower) -->
            <div>
              <div
                class="mb-2.5 font-mono text-[0.6rem] tracking-[0.1em] uppercase"
                style="color: #75726b"
              >
                git diff · Git Tower
              </div>
              <div class="n-win">
                <div class="n-titlebar">
                  <span class="n-dot" style="background: #ff2d9b"></span>
                  <span class="n-dot" style="background: #facc15"></span>
                  <span class="n-dot" style="background: #a3e635"></span>
                  <span
                    style="
                      margin-left: 0.6rem;
                      color: #a7a39c;
                      font-size: 11.5px;
                    "
                    >theme.ts — Tower</span
                  >
                </div>
                <div class="n-diff">
                  <div class="n-dhunk">
                    @@ -11,8 +11,8 @@ export const grimicorn
                  </div>
                  <div class="n-dline">
                    <span class="sg"> </span>
                    <span class="dc"
                      >&nbsp;&nbsp;base:
                      <span class="n-str">'#1C1C20'</span>,</span
                    >
                  </div>
                  <div class="n-dline del">
                    <span class="sg">-</span>
                    <span class="dc"
                      >&nbsp;&nbsp;accent:
                      <span class="n-str">'#5C6BC0'</span>,</span
                    >
                  </div>
                  <div class="n-dline add">
                    <span class="sg">+</span>
                    <span class="dc"
                      >&nbsp;&nbsp;accent:
                      <span class="n-str">'#2323FF'</span>,</span
                    >
                  </div>
                  <div class="n-dline">
                    <span class="sg"> </span>
                    <span class="dc"
                      >&nbsp;&nbsp;cursor:
                      <span class="n-str">'#A3E635'</span>,</span
                    >
                  </div>
                  <div class="n-dline del">
                    <span class="sg">-</span>
                    <span class="dc"
                      >&nbsp;&nbsp;comment:
                      <span class="n-str">'#888888'</span>,</span
                    >
                  </div>
                  <div class="n-dline add">
                    <span class="sg">+</span>
                    <span class="dc"
                      >&nbsp;&nbsp;comment:
                      <span class="n-str">'#A7A39C'</span>,</span
                    >
                  </div>
                  <div class="n-dline">
                    <span class="sg"> </span>
                    <span class="dc"
                      >&nbsp;&nbsp;error:
                      <span class="n-str">'#FF2D9B'</span>,</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- markdown -->
          <div>
            <div
              class="mb-2.5 font-mono text-[0.6rem] tracking-[0.1em] uppercase"
              style="color: #75726b"
            >
              markdown · heading waterfall
            </div>
            <div class="n-win">
              <div class="n-titlebar">
                <span class="n-dot" style="background: #ff2d9b"></span>
                <span class="n-dot" style="background: #facc15"></span>
                <span class="n-dot" style="background: #a3e635"></span>
                <span
                  style="margin-left: 0.6rem; color: #a7a39c; font-size: 11.5px"
                  >notes.md — Obsidian</span
                >
              </div>
              <div class="n-md">
                <div class="h1"># Grimicorn Neon</div>
                <p>The grim reaper, plugged into the <i>mains</i>.</p>
                <div class="h2">## Philosophy</div>
                <p>
                  Near-black base, <b>neon syntax</b>, everything
                  <i>turned up to 11</i>.
                </p>
                <div class="h3">### Accent order</div>
                <ul>
                  <li>Blue → Purple → Teal</li>
                  <li>Green = success, Pink = error</li>
                </ul>
                <div class="h4">#### Heading four</div>
                <div class="h5">##### Heading five</div>
                <div class="h6">###### Heading six</div>
                <blockquote>
                  "Loud by default." — <code>const calm = false</code>
                </blockquote>
                <p><a href="#neon-palette">Read the full palette →</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TOOLS / DOWNLOADS -->
    <section
      id="neon-tools"
      class="border-t px-8 py-20 max-md:px-4"
      style="border-color: #1c1c20"
    >
      <div class="mx-auto max-w-[1180px]">
        <div class="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              class="reveal mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.1em] uppercase"
              style="color: #a7a39c"
            >
              <span class="n-bar"></span>
              get the theme
            </div>
            <h2
              class="reveal mb-2 font-mono leading-none font-bold"
              style="font-size: clamp(1.6rem, 3vw, 2.2rem); color: #e7e5e4"
            >
              Fifteen ports
            </h2>
            <p
              class="reveal max-w-[480px] font-mono text-[0.72rem] leading-[1.7]"
              style="color: #a7a39c"
            >
              Dark-only, one neon file each. Grab one, or take the whole set.
            </p>
          </div>
          <div class="reveal flex flex-wrap items-center gap-3">
            <a :href="NEON_PALETTE_HREF" download class="n-btn n-btn-ghost"
              >palette.md</a
            >
            <a
              :href="NEON_ZIP_HREF"
              download
              class="n-btn n-btn-rainbow"
              :style="{ backgroundImage: rainbowGradient }"
            >
              download all (.zip)
            </a>
          </div>
        </div>

        <div
          class="stagger grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1"
        >
          <div
            v-for="tool in sortedTools"
            :key="tool.name"
            class="n-card group flex flex-col border-t-2 pt-5"
            :style="{ borderColor: tool.featured ? '#a855f7' : '#1c1c20' }"
          >
            <div class="mb-2 flex items-start gap-3">
              <span class="n-icon mt-0.5 shrink-0">
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
                    class="font-mono text-[0.92rem] font-bold"
                    style="color: #e7e5e4"
                    >{{ tool.name }}</span
                  >
                  <span v-if="tool.featured" class="n-badge">featured</span>
                </div>
              </div>
            </div>
            <p
              class="mb-4 min-h-[2.5rem] font-mono text-[0.66rem] leading-[1.6]"
              style="color: #a7a39c"
            >
              {{ tool.desc }}
            </p>
            <div class="mb-3 flex gap-2">
              <a
                v-for="file in tool.files"
                :key="file.download"
                :href="file.href"
                :download="file.download"
                class="n-file inline-flex min-w-[88px] flex-1 items-center justify-center gap-1.5 rounded-[2px] border px-2 py-2 text-center font-mono text-[0.66rem] no-underline"
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
            <details class="mt-auto">
              <summary
                class="n-summary cursor-pointer font-mono text-[0.6rem]"
                style="color: #75726b"
              >
                <span class="n-chevron inline-block">▸</span> install
              </summary>
              <p
                class="mt-2 font-mono text-[0.62rem] leading-[1.7]"
                style="color: #a7a39c"
                v-html="tool.install"
              ></p>
              <a
                :href="tool.docs"
                target="_blank"
                rel="noopener"
                class="n-link mt-2 inline-block font-mono text-[0.6rem]"
                >docs →</a
              >
            </details>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.n-scope {
  background: #0a0a0b;
  color: #e7e5e4;
  /* Always-on rave: push the saturation site-wide. */
  filter: saturate(1.2);
}

.n-hero {
  background:
    radial-gradient(
      circle at 80% -10%,
      rgba(168, 85, 247, 0.16),
      transparent 45%
    ),
    radial-gradient(circle at 0% 10%, rgba(34, 211, 238, 0.1), transparent 40%);
}
.n-hero-glow {
  position: absolute;
  inset: -200px -160px auto auto;
  width: 620px;
  height: 620px;
  background: radial-gradient(
    circle,
    rgba(255, 45, 155, 0.16),
    rgba(168, 85, 247, 0.08) 45%,
    transparent 70%
  );
  filter: blur(28px);
  animation: n-glow 3.5s ease-in-out infinite;
  pointer-events: none;
}

/* Rainbow gradient text + its endless pan. */
.n-rainbow {
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: n-rainbow-pan 4s linear infinite;
}
@keyframes n-rainbow-pan {
  to {
    background-position: 200% center;
  }
}
@keyframes n-glow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.9;
  }
}

.n-rave-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #a3e635;
  box-shadow: 0 0 0 0 rgba(163, 230, 53, 0.6);
  animation: n-pulse 1.8s ease-in-out infinite;
}
@keyframes n-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(163, 230, 53, 0.6);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(163, 230, 53, 0);
  }
}

.n-bar {
  display: inline-block;
  width: 1.5rem;
  height: 1px;
  background: #a855f7;
}
.n-link {
  color: #22d3ee;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.n-link:hover {
  color: #2323ff;
}

.n-btn {
  border-radius: 8px;
  padding: 12px 20px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}
.n-btn-rainbow {
  background-size: 200% auto;
  color: #0a0a0b;
  animation: n-rainbow-pan 4s linear infinite;
}
.n-btn-rainbow:hover {
  transform: translateY(-1px);
}
.n-btn-ghost {
  border: 2px solid #303036;
  color: #e7e5e4;
}
.n-btn-ghost:hover {
  border-color: #a855f7;
  color: #a855f7;
}

/* swatches */
.n-swatch {
  background: #0a0a0b;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.2s ease;
}
.n-swatch:hover {
  transform: translateY(-2px);
}
.n-swatch:focus-visible {
  outline: 2px solid #22d3ee;
  outline-offset: 2px;
}

/* preview windows */
.n-win {
  overflow: hidden;
  border: 1px solid #1c1c20;
  border-radius: 10px;
  background: #0a0a0b;
  font-family: var(--font-mono);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
}
.n-titlebar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.95rem;
  background: #050506;
  border-bottom: 1px solid #1c1c20;
}
.n-dot {
  display: inline-block;
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.n-code {
  padding: 1.1rem 0;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.95;
  color: #e7e5e4;
}
.n-term {
  padding: 1.1rem 1.3rem;
  overflow-x: auto;
  background: #131316;
  font-size: 13px;
  line-height: 1.95;
  color: #e7e5e4;
}
.n-line {
  display: flex;
  padding: 0 1.3rem;
}
.n-line.hl {
  background: #1c1c20;
}
.n-ln {
  width: 2.1rem;
  flex-shrink: 0;
  padding-right: 1.1rem;
  color: #5a5a60;
  font-size: 12px;
  text-align: right;
  user-select: none;
}
.n-src {
  color: #e7e5e4;
}
.n-key {
  color: #2323ff;
}
.n-fn {
  color: #a855f7;
}
.n-str {
  color: #a3e635;
}
.n-type {
  color: #facc15;
}
.n-num {
  color: #22d3ee;
}
.n-op {
  color: #2323ff;
}
.n-prop {
  color: #22d3ee;
}
.n-com {
  color: #a7a39c;
  font-style: italic;
}

/* terminal tokens */
.n-term .u {
  color: #a3e635;
}
.n-term .at {
  color: #75726b;
}
.n-term .path {
  color: #2323ff;
}
.n-term .pr {
  color: #75726b;
}
.n-term .ok {
  color: #a3e635;
}
.n-term .mod {
  color: #facc15;
}
.n-term .del {
  color: #ff2d9b;
}
.n-term .info {
  color: #22d3ee;
}
.n-term .mut {
  color: #a7a39c;
}

/* git diff */
.n-diff {
  padding: 0.9rem 0 1.1rem;
  overflow-x: auto;
  background: #0a0a0b;
  color: #e7e5e4;
  font-size: 13px;
  line-height: 1.85;
}
.n-dhunk {
  margin-bottom: 0.3rem;
  padding: 0.15rem 1.3rem;
  background: #131316;
  color: #22d3ee;
  font-size: 12.5px;
}
.n-dline {
  display: flex;
  padding: 0 1.3rem;
}
.n-dline .sg {
  width: 1.3rem;
  flex-shrink: 0;
  color: #75726b;
  user-select: none;
}
.n-dline .dc {
  color: #e7e5e4;
}
.n-dline.add {
  background: rgba(163, 230, 53, 0.14);
  box-shadow: inset 2px 0 0 #a3e635;
}
.n-dline.add .sg {
  color: #a3e635;
}
.n-dline.del {
  background: rgba(255, 45, 155, 0.14);
  box-shadow: inset 2px 0 0 #ff2d9b;
}
.n-dline.del .sg {
  color: #ff2d9b;
}

/* markdown */
.n-md {
  padding: 1.6rem 1.8rem;
  background: #0a0a0b;
  color: #e7e5e4;
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.7;
}
.n-md .h1 {
  margin: 0 0 0.2rem;
  color: #2323ff;
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.n-md .h2 {
  margin: 1.1rem 0 0.3rem;
  color: #a855f7;
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 700;
}
.n-md .h3 {
  margin: 0.9rem 0 0.3rem;
  color: #22d3ee;
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
}
.n-md .h4 {
  margin: 0.8rem 0 0.2rem;
  color: #a3e635;
  font-family: var(--font-mono);
  font-size: 0.92rem;
  font-weight: 600;
}
.n-md .h5 {
  margin: 0.7rem 0 0.2rem;
  color: #facc15;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 600;
}
.n-md .h6 {
  margin: 0.6rem 0 0.2rem;
  color: #a7a39c;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.n-md p {
  margin: 0.4rem 0;
  color: #e7e5e4;
}
.n-md b {
  color: #facc15;
  font-weight: 700;
}
.n-md i {
  color: #a855f7;
  font-style: italic;
}
.n-md a {
  color: #2323ff;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.n-md code {
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  background: #131316;
  color: #22d3ee;
  font-family: var(--font-mono);
  font-size: 0.85em;
}
.n-md blockquote {
  margin: 0.6rem 0;
  padding: 0.1rem 0 0.1rem 0.9rem;
  border-left: 3px solid #2323ff;
  color: #a7a39c;
  font-style: italic;
}
.n-md ul {
  margin: 0.4rem 0;
  padding-left: 1.1rem;
}
.n-md li {
  margin: 0.15rem 0;
}
.n-md li::marker {
  color: #22d3ee;
}
.n-cursor {
  display: inline-block;
  width: 8px;
  height: 15px;
  background: #a3e635;
  box-shadow: 0 0 8px #a3e635;
  vertical-align: -2px;
  animation: n-blink 1.1s step-end infinite;
}
@keyframes n-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

/* tool cards */
.n-card {
  --card-accent: #a855f7;
}
.n-icon {
  color: #22d3ee;
}
.n-badge {
  border-radius: 2px;
  padding: 1px 6px;
  background: rgba(168, 85, 247, 0.18);
  color: #a855f7;
  font-family: var(--font-mono);
  font-size: 0.54rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.n-file {
  border-color: #1c1c20;
  color: #a7a39c;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}
.n-file:hover {
  border-color: #22d3ee;
  color: #22d3ee;
}
.n-summary {
  list-style: none;
}
.n-summary::-webkit-details-marker {
  display: none;
}
details[open] .n-chevron {
  transform: rotate(90deg);
}
.n-chevron {
  transition: transform 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  .n-rainbow,
  .n-btn-rainbow,
  .n-hero-glow,
  .n-rave-dot,
  .n-cursor {
    animation: none;
  }
}
</style>
