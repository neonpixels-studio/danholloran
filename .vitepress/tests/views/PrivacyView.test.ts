import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import PrivacyView from "@views/PrivacyView.vue";
import {
  initAnalyticsConsent,
  resetAnalyticsConsentState,
  useAnalyticsConsent,
} from "@composables/useAnalyticsConsent";

describe("PrivacyView", () => {
  beforeEach(() => {
    localStorage.clear();
    resetAnalyticsConsentState();
  });

  afterEach(() => {
    resetAnalyticsConsentState();
  });

  it("renders correctly", () => {
    const wrapper = shallowMount(PrivacyView);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("covers Google Analytics and the newsletter provider", () => {
    const text = shallowMount(PrivacyView).text();
    expect(text).toContain("Google Analytics");
    expect(text).toContain("Kit");
  });

  it("offers a way to change the choice once choosing is available", async () => {
    const wrapper = shallowMount(PrivacyView);
    expect(wrapper.find("button").exists()).toBe(false);

    initAnalyticsConsent();
    useAnalyticsConsent().decline();
    await wrapper.vm.$nextTick();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);

    await wrapper.find("button").trigger("click");

    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });
});
