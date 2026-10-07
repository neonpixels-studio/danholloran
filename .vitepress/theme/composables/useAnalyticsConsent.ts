import { ref, readonly } from "vue";

export type ConsentChoice = "granted" | "denied";
type ConsentState = ConsentChoice | "unset";

export const CONSENT_STORAGE_KEY = "analytics-consent";
export const GA_MEASUREMENT_ID = "G-HRDP48J1X5";
export const GA_SCRIPT_URL = "https://www.googletagmanager.com/gtag/js";
export const GA_SCRIPT_ELEMENT_ID = "ga-script";

// navigator.globalPrivacyControl is not in lib.dom yet.
type PrivacySignals = Navigator & { globalPrivacyControl?: boolean };

const state = ref<ConsentState>("unset");
const bannerVisible = ref(false);
// False once the browser itself signals opt-out; there is nothing to ask.
const canChoose = ref(true);

function isChoice(value: string | null): value is ConsentChoice {
  return value === "granted" || value === "denied";
}

/** Do Not Track or Global Privacy Control: never load, never ask. */
export function hasBrowserOptOut(
  browserNavigator: Navigator = navigator,
): boolean {
  const signals = browserNavigator as PrivacySignals;
  return (
    signals.doNotTrack === "1" ||
    signals.globalPrivacyControl === true ||
    (window as unknown as { doNotTrack?: string }).doNotTrack === "1"
  );
}

export function readConsent(): ConsentState {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    return isChoice(stored) ? stored : "unset";
  } catch {
    return "unset";
  }
}

function persistConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
}

/** The only place the GA script is added to the page. */
export function loadGoogleAnalytics(): void {
  if (document.getElementById(GA_SCRIPT_ELEMENT_ID)) {
    return;
  }
  const win = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (..._args: unknown[]) => void;
  };
  win.dataLayer = win.dataLayer || [];
  win.gtag = function gtag(..._args: unknown[]) {
    // GA reads the real `arguments` object, not a rest array.
    // eslint-disable-next-line prefer-rest-params
    win.dataLayer!.push(arguments);
  };
  win.gtag("js", new Date());
  win.gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.id = GA_SCRIPT_ELEMENT_ID;
  script.async = true;
  script.src = `${GA_SCRIPT_URL}?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/** Call once on the client after mount. */
export function initAnalyticsConsent(): void {
  if (hasBrowserOptOut()) {
    state.value = "denied";
    canChoose.value = false;
    return;
  }
  state.value = readConsent();
  if (state.value === "granted") {
    loadGoogleAnalytics();
    return;
  }
  bannerVisible.value = state.value === "unset";
}

function choose(choice: ConsentChoice): void {
  persistConsent(choice);
  state.value = choice;
  bannerVisible.value = false;
  if (choice === "granted") {
    loadGoogleAnalytics();
  }
}

export function useAnalyticsConsent() {
  return {
    state: readonly(state),
    bannerVisible: readonly(bannerVisible),
    canChoose: readonly(canChoose),
    accept: () => choose("granted"),
    decline: () => choose("denied"),
    reopen: () => {
      bannerVisible.value = canChoose.value;
    },
  };
}

/** Test helper: reset module-level state between tests. */
export function resetAnalyticsConsentState(): void {
  state.value = "unset";
  bannerVisible.value = false;
  canChoose.value = true;
}
