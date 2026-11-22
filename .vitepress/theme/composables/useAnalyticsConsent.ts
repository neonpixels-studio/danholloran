import { ref, readonly } from "vue";
import {
  disableGoogleAnalytics,
  expireGaCookies,
  loadGoogleAnalytics,
} from "../utils/googleAnalytics";

export type ConsentChoice = "granted" | "denied";
type ConsentState = ConsentChoice | "unset";

export const CONSENT_STORAGE_KEY = "danholloran:analytics-consent";
export const LEGACY_CONSENT_STORAGE_KEY = "analytics-consent";
export const CONSENT_LIFETIME_DAYS = 180;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
export const CONSENT_LIFETIME_MS = CONSENT_LIFETIME_DAYS * MILLISECONDS_PER_DAY;
// Legacy value sent by older Firefox.
const DO_NOT_TRACK_ENABLED = ["1", "yes"];

// navigator.globalPrivacyControl is not in lib.dom yet.
type PrivacySignals = Navigator & { globalPrivacyControl?: boolean };
type PrivacySignalWindow = Window & { doNotTrack?: string };

interface StoredConsent {
  choice: ConsentChoice;
  expiresAt: number;
}

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

function isStoredConsent(value: unknown, now: number): value is StoredConsent {
  const candidate = value as Partial<StoredConsent> | null;
  return (
    isChoice(candidate?.choice ?? null) &&
    typeof candidate?.expiresAt === "number" &&
    candidate.expiresAt > now &&
    // A clock jump must not turn expiry off.
    candidate.expiresAt <= now + CONSENT_LIFETIME_MS
  );
}

function parseStoredConsent(raw: string, now: number): ConsentState {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredConsent(parsed, now) ? parsed.choice : "unset";
  } catch {
    return "unset";
  }
}

/** Serialized value stored under CONSENT_STORAGE_KEY. */
export function serializeConsent(
  choice: ConsentChoice,
  now: number = Date.now(),
): string {
  const stored: StoredConsent = {
    choice,
    expiresAt: now + CONSENT_LIFETIME_MS,
  };
  return JSON.stringify(stored);
}

function persistConsent(choice: ConsentChoice): boolean {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, serializeConsent(choice));
    return true;
  } catch {
    // Storage blocked: the choice still applies for this page view.
    return false;
  }
}

/** Moves a bare value from the old key to the new shape, restarting the 180 days. */
function migrateLegacyConsent(): ConsentState {
  const legacy = localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY);
  if (legacy === null) {
    return "unset";
  }
  if (!isChoice(legacy)) {
    localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY);
    return "unset";
  }
  // Only drop the old key once the new one is safely written.
  if (persistConsent(legacy)) {
    localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY);
  }
  return legacy;
}

export function readConsent(now: number = Date.now()): ConsentState {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === null) {
      return migrateLegacyConsent();
    }
    const parsed = parseStoredConsent(stored, now);
    if (parsed === "unset") {
      return migrateLegacyConsent();
    }
    localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY);
    return parsed;
  } catch {
    return "unset";
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
