<script setup>
import { ref, watch, onMounted } from "vue";
import { useData } from "vitepress";

const { isDark } = useData();
const mapUpdatedText = ref("updated automatically");

async function fetchMapDate() {
  const url = isDark.value
    ? "/images/visited-locations-dark.png"
    : "/images/visited-locations-light.png";
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-store" });
    const lm = r.headers.get("last-modified");
    const d = lm ? new Date(lm) : null;
    console.log(d);
    if (d && !isNaN(d)) {
      mapUpdatedText.value =
        "updated " +
        d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
    }
  } catch {
    console.log("errrrrr");
    // ignore fetch errors — date display is best-effort
  }
}

onMounted(fetchMapDate);
watch(isDark, fetchMapDate);
</script>

<template>
  <section
    id="travels"
    data-screen-label="Travels"
    class="border-line border-t px-8 py-20"
  >
    <div class="mx-auto max-w-275">
      <div class="accent-line in mb-6"></div>
      <div class="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div
            class="reveal text-fg-subtle in mb-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-widest uppercase"
          >
            <span class="bg-accent inline-block h-px w-6"></span>
            on the road
          </div>
          <h2
            class="reveal in mb-2 font-mono leading-none font-bold"
            style="
              font-size: clamp(1.6rem, 3vw, 2.2rem);
              letter-spacing: var(--tracking-tightest);
            "
          >
            Where I've Been
          </h2>
          <p
            class="reveal text-fg-muted in max-w-115 font-mono text-[0.72rem] leading-[1.7]"
          >
            Every pin marks somewhere I've stopped along the way — 47 states and
            counting, mapped automatically as I go.
          </p>
        </div>
        <a
          href="/posts/?topic=travel&amp;tag=all&amp;page=1"
          class="reveal group text-accent border-accent/40 hover:bg-accent hover:border-accent in inline-flex items-center gap-2 rounded-xs border px-3 py-2 font-mono text-[0.72rem] tracking-[0.02em] no-underline transition-all hover:text-white"
        >
          <svg
            width="12"
            height="13"
            viewBox="0 0 12 13"
            fill="none"
            stroke="currentColor"
            stroke-width="1.3"
            aria-hidden="true"
          >
            <path
              d="M6 1.5C3.9 1.5 2.2 3.2 2.2 5.3c0 2.7 3.8 6.2 3.8 6.2s3.8-3.5 3.8-6.2C9.8 3.2 8.1 1.5 6 1.5Z"
            ></path>
            <circle cx="6" cy="5.3" r="1.3"></circle>
          </svg>
          travel posts
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            class="transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            <path
              d="M2 6H10M10 6L6.5 2.5M10 6L6.5 9.5"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </a>
      </div>

      <!-- Map frame -->
      <div
        class="reveal border-line bg-bg in relative mb-10 w-full overflow-hidden rounded-[3px] border"
      >
        <img
          src="/images/visited-locations-light.png"
          alt="Map of the United States with purple pins marking 47 states Dan has visited"
          class="map-img-light block h-auto w-full"
          loading="lazy"
          decoding="async"
        />
        <img
          src="/images/visited-locations-dark.png"
          alt="Map of the United States with purple pins marking 47 states Dan has visited"
          class="map-img-dark h-auto w-full"
          loading="lazy"
          decoding="async"
        />
        <span
          class="text-fg-muted bg-bg/80 border-line absolute top-3 left-3 inline-flex items-center gap-2 rounded-xs border px-2 py-1 font-mono text-[0.58rem] tracking-[0.08em] uppercase backdrop-blur-sm"
        >
          <span
            class="bg-accent inline-block h-2 w-2 rounded-full shadow-[0_0_0_3px_rgba(173,70,255,0.18)]"
          ></span>
          visited
        </span>
      </div>

      <!-- Stat strip -->
      <div
        class="stagger in grid grid-cols-5 gap-6 max-md:grid-cols-2 max-sm:grid-cols-2"
      >
        <div class="border-accent border-t-2 pt-4">
          <div
            class="tracking-tightest font-mono leading-none font-bold"
            style="font-size: clamp(1.6rem, 2.4vw, 2rem)"
          >
            47<span class="text-fg-subtle ml-1 text-[0.85rem] font-medium"
              >/50</span
            >
          </div>
          <div
            class="text-fg-subtle mt-2.5 font-mono text-[0.6rem] tracking-widest uppercase"
          >
            states visited
          </div>
        </div>
        <div class="border-line border-t-2 pt-4">
          <div
            class="tracking-tightest font-mono leading-none font-bold"
            style="font-size: clamp(1.6rem, 2.4vw, 2rem)"
          >
            60k<span class="text-accent ml-0.5 text-[1.1rem]">+</span>
          </div>
          <div
            class="text-fg-subtle mt-2.5 font-mono text-[0.6rem] tracking-widest uppercase"
          >
            miles driven
          </div>
        </div>
        <div class="border-line border-t-2 pt-4">
          <div
            class="tracking-tightest font-mono leading-none font-bold"
            style="font-size: clamp(1.6rem, 2.4vw, 2rem)"
          >
            25<span class="text-accent ml-0.5 text-[1.1rem]">+</span>
          </div>
          <div
            class="text-fg-subtle mt-2.5 font-mono text-[0.6rem] tracking-widest uppercase"
          >
            national parks
          </div>
        </div>
        <div class="border-line border-t-2 pt-4">
          <div
            class="tracking-tightest font-mono leading-none font-bold"
            style="font-size: clamp(1.6rem, 2.4vw, 2rem)"
          >
            3<span class="text-accent ml-0.5 text-[1.1rem]">×</span>
          </div>
          <div
            class="text-fg-subtle mt-2.5 font-mono text-[0.6rem] tracking-widest uppercase"
          >
            coast to coast
          </div>
        </div>
        <div class="border-line border-t-2 pt-4">
          <div
            class="tracking-tightest font-mono leading-none font-bold"
            style="font-size: clamp(1.6rem, 2.4vw, 2rem)"
          >
            1.5
            <span class="text-accent ml-0.5 text-[1.1rem]">+</span>
          </div>
          <div
            class="text-fg-subtle mt-2.5 font-mono text-[0.6rem] tracking-widest uppercase"
          >
            years on the road
          </div>
        </div>
      </div>

      <div
        class="reveal text-fg-subtle in mt-8 flex flex-wrap items-center justify-between gap-3 font-mono text-[0.62rem] tracking-[0.08em] uppercase"
      >
        <span> // still to come — Louisiana, Alaska &amp; Hawaii </span>
        <span class="inline-flex items-center gap-2">
          <span
            class="live-dot inline-block h-1.5 w-1.5 rounded-full bg-green-500"
          ></span>
          <span id="mapUpdated">
            {{ mapUpdatedText }}
          </span>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-img-dark {
  display: none;
}
html.dark .map-img-light {
  display: none;
}
html.dark .map-img-dark {
  display: block;
}
</style>
