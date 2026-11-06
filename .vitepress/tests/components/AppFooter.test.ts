import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { PAST_LOCATIONS } from "@data/resume.ts";

const frontmatterState = { value: {} as Record<string, unknown> };
vi.mock("vitepress", () => ({
  useData: () => ({ frontmatter: frontmatterState }),
}));

const FORCED_LOCATION = { city: "Testville", state: "TX" };
const forcedLocationState = {
  value: null as { city: string; state: string } | null,
};
vi.mock("@data/footerLocation.ts", () => ({
  get FORCED_FOOTER_LOCATION() {
    return forcedLocationState.value;
  },
}));

import AppFooter from "@components/AppFooter.vue";
import {
  initAnalyticsConsent,
  resetAnalyticsConsentState,
} from "@composables/useAnalyticsConsent";

const ROTATE_MS = 3000;

function stubReducedMotion(matches: boolean): void {
  const listeners = new Set<() => void>();
  const query = {
    matches,
    addEventListener: (_event: string, callback: () => void) =>
      listeners.add(callback),
    removeEventListener: (_event: string, callback: () => void) =>
      listeners.delete(callback),
  };
  window.matchMedia = vi.fn(() => query) as unknown as typeof window.matchMedia;
}

function locationLabel(index: number): string {
  return `${PAST_LOCATIONS[index].city}, ${PAST_LOCATIONS[index].state}`;
}

describe("AppFooter", () => {
  beforeEach(() => {
    forcedLocationState.value = null;
    localStorage.clear();
    resetAnalyticsConsentState();
  });

  afterEach(() => {
    resetAnalyticsConsentState();
  });

  it("renders correctly", () => {
    frontmatterState.value = {};
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("offers an analytics preferences button once choice is available", async () => {
    frontmatterState.value = {};
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.find("button").exists()).toBe(false);

    initAnalyticsConsent();
    await wrapper.vm.$nextTick();

    expect(wrapper.find("button").text()).toBe("analytics");
  });

  it("links to the privacy note", () => {
    frontmatterState.value = {};
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.find('a[href="/privacy"]').text()).toBe("privacy");
  });

  it("is not forced dark without the frontmatter flag", () => {
    frontmatterState.value = {};
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.find("footer").classes()).not.toContain("dark");
  });

  it("forces dark when frontmatter sets forceDarkFooter", () => {
    frontmatterState.value = { forceDarkFooter: true };
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.find("footer").classes()).toContain("dark");
  });
});

describe("AppFooter location rotation", () => {
  beforeEach(() => {
    forcedLocationState.value = null;
    frontmatterState.value = {};
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rotates the location when motion is allowed", async () => {
    stubReducedMotion(false);
    const wrapper = shallowMount(AppFooter);
    expect(wrapper.text()).toContain(locationLabel(0));
    vi.advanceTimersByTime(ROTATE_MS);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain(locationLabel(1));
  });

  it("does not rotate the location under reduced motion", async () => {
    stubReducedMotion(true);
    const wrapper = shallowMount(AppFooter);
    vi.advanceTimersByTime(ROTATE_MS * 3);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain(locationLabel(0));
  });

  it("shows only the forced location and never rotates it", async () => {
    forcedLocationState.value = FORCED_LOCATION;
    stubReducedMotion(false);
    const wrapper = shallowMount(AppFooter);
    const forcedLabel = `${FORCED_LOCATION.city}, ${FORCED_LOCATION.state}`;
    expect(wrapper.text()).toContain(forcedLabel);
    vi.advanceTimersByTime(ROTATE_MS * 3);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain(forcedLabel);
    expect(wrapper.text()).not.toContain(locationLabel(0));
  });
});
