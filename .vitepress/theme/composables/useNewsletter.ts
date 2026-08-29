import { computed, ref } from "vue";
import { useAnalytics } from "@composables/useAnalytics";
import { withTimeoutSignal } from "@utils/timeoutSignal";

const KIT_FORM_ACTION = "https://app.kit.com/forms/9565549/subscriptions";
const SUBSCRIBE_EVENT = "newsletter_subscribe";
// Bounds the Kit request so a hung connection aborts and re-enables the form
// instead of pinning status at "loading" until a page reload.
const REQUEST_TIMEOUT_MS = 10_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Kit treats an address case-insensitively, so normalize before comparing to
// the address that already succeeded — a case-only re-type is the same signup.
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export type NewsletterStatus = "idle" | "loading" | "success" | "error";

export function useNewsletter() {
  const email = ref("");
  const status = ref<NewsletterStatus>("idle");
  const errorMessage = ref("");
  // Every address that has succeeded on this form instance, so re-typing any
  // earlier one (not just the most recent) still re-affirms without a second
  // POST. A Set in a ref stays deep-reactive in Vue 3, so `.add` retriggers the
  // computed.
  const subscribedEmails = ref(new Set<string>());
  const { trackEvent } = useAnalytics();

  // Drives the UI's "already subscribed" lock: true only while the entered
  // address is one that already succeeded. Editing to an unsubscribed address
  // flips it false so the form re-opens for another signup, rather than gating
  // the UI on status === "success" (which stays locked to the first address).
  const isSubscribedAddress = computed(() =>
    subscribedEmails.value.has(normalizeEmail(email.value)),
  );

  async function subscribe() {
    // One request at a time.
    if (status.value === "loading") {
      return;
    }

    const trimmedEmail = email.value.trim();

    // Re-affirm success without a second POST when the entered address is the
    // one that already succeeded; shares `isSubscribedAddress` so the guard and
    // the UI lock can't drift.
    if (isSubscribedAddress.value) {
      status.value = "success";
      errorMessage.value = "";
      return;
    }

    if (!EMAIL_RE.test(trimmedEmail)) {
      status.value = "error";
      errorMessage.value = "enter a valid email address.";
      return;
    }

    status.value = "loading";
    errorMessage.value = "";

    const timeout = withTimeoutSignal(REQUEST_TIMEOUT_MS);
    try {
      const fd = new FormData();
      fd.append("email_address", trimmedEmail);
      const res = await fetch(KIT_FORM_ACTION, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
        signal: timeout.signal,
      });
      if (!res.ok) {
        status.value = "error";
        errorMessage.value = "something went wrong — please try again.";
        return;
      }
    } catch {
      status.value = "error";
      errorMessage.value = "network error — please try again.";
      return;
    } finally {
      timeout.clear();
    }

    status.value = "success";
    subscribedEmails.value.add(normalizeEmail(trimmedEmail));
    trackEvent(SUBSCRIBE_EVENT);
  }

  return { email, status, errorMessage, isSubscribedAddress, subscribe };
}
