import { ref, readonly } from "vue";
import {
  disableGoogleAnalytics,
  expireGaCookies,
  loadGoogleAnalytics,
} from "../utils/googleAnalytics";

export type ConsentChoice = "granted" | "denied";
type ConsentState = ConsentChoice | "unset";

export const CONSENT_STORAGE_KEY = "analytics-consent";
// Legacy value sent by older Firefox.
const DO_NOT_TRACK_ENABLED = ["1", "yes"];

// navigator.globalPrivacyControl is not in lib.dom yet.
type PrivacySignals = Navigator & { globalPrivacyControl?: boolean };
type PrivacySignalWindow = Window & { doNotTrack?: string };

const state = ref<ConsentState>("unset");
const bannerVisible = ref(false);
// Off until the client confirms the browser has not opted out, so opted-out
// readers never see a control that does nothing.
const canChoose = ref(false);

function isChoice(value: string | null): value is ConsentChoice {
  return value === "granted" || value === "denied";
}

/** Do Not Track or Global Privacy Control: never load, never ask. */
export function hasBrowserOptOut(
  browserNavigator: Navigator = navigator,
  browserWindow: Window = window,
): boolean {
  const signals = browserNavigator as PrivacySignals;
  const legacyWindowSignal = (browserWindow as PrivacySignalWindow).doNotTrack;
  return (
    DO_NOT_TRACK_ENABLED.includes(signals.doNotTrack ?? "") ||
    DO_NOT_TRACK_ENABLED.includes(legacyWindowSignal ?? "") ||
    signals.globalPrivacyControl === true
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

/** Call once on the client after mount. */
export function initAnalyticsConsent(): void {
  if (hasBrowserOptOut()) {
    state.value = "denied";
    expireGaCookies();
    return;
  }
  canChoose.value = true;
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
    return;
  }
  disableGoogleAnalytics();
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
  canChoose.value = false;
}
