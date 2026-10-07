import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import AnalyticsConsentBanner from "@components/AnalyticsConsentBanner.vue";
import {
  CONSENT_STORAGE_KEY,
  GA_SCRIPT_ELEMENT_ID,
  resetAnalyticsConsentState,
} from "@composables/useAnalyticsConsent";
import { clearGtag } from "../helpers/gtag";
import { silenceScriptLoading } from "../helpers/gaScript";

describe("AnalyticsConsentBanner", () => {
  beforeEach(() => {
    silenceScriptLoading();
    localStorage.clear();
    resetAnalyticsConsentState();
  });

  afterEach(() => {
    document.getElementById(GA_SCRIPT_ELEMENT_ID)?.remove();
    clearGtag();
  });

  it("asks for consent without loading analytics", async () => {
    const wrapper = mount(AnalyticsConsentBanner);
    await flushPromises();

    expect(wrapper.find("section").exists()).toBe(true);
    expect(wrapper.findAll("button")).toHaveLength(2);
    expect(document.getElementById(GA_SCRIPT_ELEMENT_ID)).toBeNull();
  });

  it("loads analytics only after Allow is clicked", async () => {
    const wrapper = mount(AnalyticsConsentBanner);
    await flushPromises();
    await wrapper.findAll("button")[0].trigger("click");

    expect(document.getElementById(GA_SCRIPT_ELEMENT_ID)).not.toBeNull();
    expect(wrapper.find("section").exists()).toBe(false);
  });

  it("stays off and hides after Decline is clicked", async () => {
    const wrapper = mount(AnalyticsConsentBanner);
    await flushPromises();
    await wrapper.findAll("button")[1].trigger("click");

    expect(document.getElementById(GA_SCRIPT_ELEMENT_ID)).toBeNull();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("denied");
    expect(wrapper.find("section").exists()).toBe(false);
  });

  it("renders nothing when a choice is already stored", async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "denied");
    const wrapper = mount(AnalyticsConsentBanner);
    await flushPromises();

    expect(wrapper.find("section").exists()).toBe(false);
  });
});
