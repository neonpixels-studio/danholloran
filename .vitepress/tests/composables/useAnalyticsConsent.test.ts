import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  hasBrowserOptOut,
  initAnalyticsConsent,
  resetAnalyticsConsentState,
  useAnalyticsConsent,
} from "../../theme/composables/useAnalyticsConsent";
import {
  GA_MEASUREMENT_ID,
  GA_SCRIPT_ELEMENT_ID,
  GA_SCRIPT_URL,
} from "../../theme/utils/googleAnalytics";
import { clearGtag } from "../helpers/gtag";
import { silenceScriptLoading } from "../helpers/gaScript";

function gaScript(): HTMLScriptElement | null {
  return document.getElementById(
    GA_SCRIPT_ELEMENT_ID,
  ) as HTMLScriptElement | null;
}

function stubDoNotTrack(value: string | null): void {
  vi.spyOn(navigator, "doNotTrack", "get").mockReturnValue(value);
}

describe("useAnalyticsConsent", () => {
  beforeEach(() => {
    silenceScriptLoading();
    localStorage.clear();
    resetAnalyticsConsentState();
  });

  afterEach(() => {
    gaScript()?.remove();
    clearGtag();
    delete (window as unknown as { dataLayer?: unknown }).dataLayer;
    vi.restoreAllMocks();
  });

  it("does not load gtag and shows the banner when no choice is stored", () => {
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect((window as unknown as { gtag?: unknown }).gtag).toBeUndefined();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it("does not load gtag when consent was denied", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "denied");
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
  });

  it("ignores unrecognised stored values", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "yes please");
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it("loads gtag on init when consent was previously granted", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    initAnalyticsConsent();

    expect(gaScript()?.src).toContain(GA_SCRIPT_URL);
    expect(typeof (window as unknown as { gtag?: unknown }).gtag).toBe(
      "function",
    );
  });

  it("loads gtag only after accept() and persists the choice", () => {
    initAnalyticsConsent();
    expect(gaScript()).toBeNull();

    useAnalyticsConsent().accept();

    expect(gaScript()).not.toBeNull();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("granted");
    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
  });

  it("never loads gtag after decline() and persists the choice", () => {
    initAnalyticsConsent();
    useAnalyticsConsent().decline();

    expect(gaScript()).toBeNull();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("denied");
  });

  it("does not add the script twice", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    initAnalyticsConsent();
    useAnalyticsConsent().accept();

    expect(document.querySelectorAll(`#${GA_SCRIPT_ELEMENT_ID}`)).toHaveLength(
      1,
    );
  });

  it("never loads gtag with Do Not Track on, even with stored consent", () => {
    stubDoNotTrack("1");
    localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
    expect(useAnalyticsConsent().canChoose.value).toBe(false);
  });

  it("never loads gtag with Global Privacy Control on", () => {
    vi.stubGlobal("navigator", {
      doNotTrack: null,
      globalPrivacyControl: true,
    });
    localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    initAnalyticsConsent();
    vi.unstubAllGlobals();

    expect(gaScript()).toBeNull();
  });

  it("does not reopen the banner when the browser opts out", () => {
    stubDoNotTrack("1");
    initAnalyticsConsent();
    useAnalyticsConsent().reopen();

    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
  });

  it("reopen() shows the banner again after a choice", () => {
    initAnalyticsConsent();
    useAnalyticsConsent().decline();
    useAnalyticsConsent().reopen();

    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it("survives blocked localStorage by treating consent as unset", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
  });

  it("disables an already-loaded GA when consent is withdrawn", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    initAnalyticsConsent();
    document.cookie = "_ga=abc; path=/";
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;

    useAnalyticsConsent().decline();

    expect(
      (window as unknown as Record<string, unknown>)[
        `ga-disable-${GA_MEASUREMENT_ID}`
      ],
    ).toBe(true);
    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "denied",
    });
    expect(document.cookie).not.toContain("_ga=");
    delete (window as unknown as Record<string, unknown>)[
      `ga-disable-${GA_MEASUREMENT_ID}`
    ];
  });

  it("treats the legacy 'yes' Do Not Track value as opt-out", () => {
    stubDoNotTrack("yes");
    expect(hasBrowserOptOut()).toBe(true);
  });

  it("reads the legacy window.doNotTrack signal", () => {
    stubDoNotTrack(null);
    expect(hasBrowserOptOut(navigator, { doNotTrack: "1" } as Window)).toBe(
      true,
    );
  });

  it("hasBrowserOptOut is false when no signal is present", () => {
    stubDoNotTrack(null);
    expect(hasBrowserOptOut()).toBe(false);
  });
});
