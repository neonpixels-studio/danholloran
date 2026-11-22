import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CONSENT_LIFETIME_MS,
  CONSENT_STORAGE_KEY,
  LEGACY_CONSENT_STORAGE_KEY,
  serializeConsent,
  hasBrowserOptOut,
  initAnalyticsConsent,
  resetAnalyticsConsentState,
  useAnalyticsConsent,
} from "../../theme/composables/useAnalyticsConsent";
import {
  GA_DISABLE_FLAG,
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

function gaDisabledFlag(): unknown {
  return (window as unknown as Record<string, unknown>)[GA_DISABLE_FLAG];
}

function storedConsent(): { choice: string; expiresAt: number } | null {
  const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

const FROZEN_NOW = new Date("2026-01-01T00:00:00Z");

function freezeTime(): void {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
}

function storeConsent(choice: "granted" | "denied", now?: number): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, serializeConsent(choice, now));
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
    delete (window as unknown as Record<string, unknown>)[GA_DISABLE_FLAG];
    document.cookie = `_ga=; expires=${new Date(0).toUTCString()}; path=/`;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("does not load gtag and shows the banner when no choice is stored", () => {
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect((window as unknown as { gtag?: unknown }).gtag).toBeUndefined();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it("does not load gtag when consent was denied", () => {
    storeConsent("denied");
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
  });

  it("treats a malformed stored value as no choice", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "yes please");
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it("loads gtag on init when consent was previously granted", () => {
    storeConsent("granted");
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
    expect(storedConsent()).toEqual({
      choice: "granted",
      expiresAt: expect.any(Number),
    });
    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
  });

  it("never loads gtag after decline() and persists the choice", () => {
    initAnalyticsConsent();
    useAnalyticsConsent().decline();

    expect(gaScript()).toBeNull();
    expect(storedConsent()?.choice).toBe("denied");
  });

  it("does not add the script twice", () => {
    storeConsent("granted");
    initAnalyticsConsent();
    useAnalyticsConsent().accept();

    expect(document.querySelectorAll(`#${GA_SCRIPT_ELEMENT_ID}`)).toHaveLength(
      1,
    );
  });

  it("never loads gtag with Do Not Track on, even with stored consent", () => {
    stubDoNotTrack("1");
    storeConsent("granted");
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
    storeConsent("granted");
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
    storeConsent("granted");
    initAnalyticsConsent();
    document.cookie = `_ga=abc; path=/; domain=${location.hostname}`;
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;

    useAnalyticsConsent().decline();

    expect(gaDisabledFlag()).toBe(true);
    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "denied",
    });
    expect(document.cookie).not.toContain("_ga=");
  });

  it("re-enables a loaded GA when consent is granted again", () => {
    storeConsent("granted");
    initAnalyticsConsent();
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;

    useAnalyticsConsent().decline();
    useAnalyticsConsent().accept();

    expect(gaDisabledFlag()).toBe(false);
    expect(gtag).toHaveBeenLastCalledWith("consent", "update", {
      analytics_storage: "granted",
    });
  });

  it("loads GA after declining first, then allowing without a reload", () => {
    initAnalyticsConsent();
    useAnalyticsConsent().decline();
    useAnalyticsConsent().accept();

    expect(gaScript()).not.toBeNull();
    expect(gaDisabledFlag()).toBe(false);
  });

  it("clears earlier GA cookies when the browser opts out", () => {
    document.cookie = "_ga=abc; path=/";
    stubDoNotTrack("1");
    initAnalyticsConsent();

    expect(document.cookie).not.toContain("_ga=");
  });

  it("only offers a choice when the browser has not opted out", () => {
    stubDoNotTrack(null);
    initAnalyticsConsent();

    expect(useAnalyticsConsent().canChoose.value).toBe(true);
  });

  it("treats the legacy 'yes' Do Not Track value as opt-out", () => {
    stubDoNotTrack("yes");
    expect(hasBrowserOptOut()).toBe(true);
  });

  it("reads the legacy window.doNotTrack signal", () => {
    stubDoNotTrack(null);
    expect(
      hasBrowserOptOut(navigator, { doNotTrack: "1" } as unknown as Window),
    ).toBe(true);
  });

  it("hasBrowserOptOut is false when no signal is present", () => {
    stubDoNotTrack(null);
    expect(hasBrowserOptOut()).toBe(false);
  });

  it("stores the choice for 180 days", () => {
    freezeTime();
    initAnalyticsConsent();
    useAnalyticsConsent().accept();

    expect(storedConsent()!.expiresAt).toBe(Date.now() + CONSENT_LIFETIME_MS);
    expect(CONSENT_LIFETIME_MS).toBe(180 * 24 * 60 * 60 * 1000);
  });

  it("asks again and does not load gtag when a granted choice has expired", () => {
    storeConsent("granted", Date.now() - CONSENT_LIFETIME_MS - 1000);
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it("asks again when a denied choice has expired", () => {
    storeConsent("denied", Date.now() - CONSENT_LIFETIME_MS - 1000);
    initAnalyticsConsent();

    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it.each([
    ["wrong shape", JSON.stringify({ choice: "granted" })],
    [
      "unknown choice",
      JSON.stringify({ choice: "maybe", expiresAt: Date.now() + 1e9 }),
    ],
    [
      "non-numeric expiry",
      JSON.stringify({ choice: "granted", expiresAt: "soon" }),
    ],
    ["null", "null"],
  ])("treats a %s stored value as no choice", (_label, raw) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, raw);
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it("migrates a granted value from the old key and loads gtag", () => {
    freezeTime();
    localStorage.setItem(LEGACY_CONSENT_STORAGE_KEY, "granted");
    initAnalyticsConsent();

    expect(gaScript()).not.toBeNull();
    expect(localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY)).toBeNull();
    expect(storedConsent()?.choice).toBe("granted");
    expect(storedConsent()!.expiresAt).toBe(Date.now() + CONSENT_LIFETIME_MS);
  });

  it("migrates a denied value from the old key without showing the banner", () => {
    localStorage.setItem(LEGACY_CONSENT_STORAGE_KEY, "denied");
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
    expect(localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY)).toBeNull();
    expect(storedConsent()?.choice).toBe("denied");
  });

  it("removes an unrecognised old-key value and treats it as no choice", () => {
    localStorage.setItem(LEGACY_CONSENT_STORAGE_KEY, "yes please");
    initAnalyticsConsent();

    expect(localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY)).toBeNull();
    expect(storedConsent()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it("prefers the new key over a leftover old key", () => {
    storeConsent("denied");
    localStorage.setItem(LEGACY_CONSENT_STORAGE_KEY, "granted");
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
    expect(storedConsent()?.choice).toBe("denied");
    expect(localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY)).toBeNull();
  });

  it("migrates the old key when the new key is expired", () => {
    freezeTime();
    storeConsent("granted", Date.now() - CONSENT_LIFETIME_MS - 1000);
    localStorage.setItem(LEGACY_CONSENT_STORAGE_KEY, "denied");
    initAnalyticsConsent();

    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
    expect(storedConsent()?.choice).toBe("denied");
    expect(localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY)).toBeNull();
  });

  it("honours a choice that has one second left", () => {
    freezeTime();
    storeConsent("granted", Date.now() - CONSENT_LIFETIME_MS + 1000);
    initAnalyticsConsent();

    expect(gaScript()).not.toBeNull();
  });

  it("treats a choice expiring exactly now as expired", () => {
    freezeTime();
    storeConsent("granted", Date.now() - CONSENT_LIFETIME_MS);
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
    expect(useAnalyticsConsent().bannerVisible.value).toBe(true);
  });

  it("treats an expiry beyond 180 days as no choice", () => {
    freezeTime();
    storeConsent("granted", Date.now() + 1000);
    initAnalyticsConsent();

    expect(gaScript()).toBeNull();
  });

  it("keeps the old key when the new one cannot be written", () => {
    localStorage.setItem(LEGACY_CONSENT_STORAGE_KEY, "denied");
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    initAnalyticsConsent();

    expect(localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY)).toBe("denied");
    expect(useAnalyticsConsent().bannerVisible.value).toBe(false);
  });
});
