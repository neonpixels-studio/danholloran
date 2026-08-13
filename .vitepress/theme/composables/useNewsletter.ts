import { ref } from "vue";
import { useAnalytics } from "@composables/useAnalytics";

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

// Undefined on browsers without AbortSignal.timeout so the request stays
// unbounded (as before) rather than throwing and failing every subscribe.
function requestTimeoutSignal(): AbortSignal | undefined {
  if (
    typeof AbortSignal === "undefined" ||
    typeof AbortSignal.timeout !== "function"
  ) {
    return undefined;
  }
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
}

export type NewsletterStatus = "idle" | "loading" | "success" | "error";

export function useNewsletter() {
  const email = ref("");
  const status = ref<NewsletterStatus>("idle");
  const errorMessage = ref("");
  const subscribedEmail = ref("");
  const { trackEvent } = useAnalytics();

  async function subscribe() {
    // One request at a time.
    if (status.value === "loading") {
      return;
    }

    const trimmedEmail = email.value.trim();

    // Success lock scoped to the address that succeeded: a repeat submit of the
    // same address (case/whitespace aside) re-affirms success and sends
    // nothing, while editing to a different address re-enables the form.
    if (
      subscribedEmail.value !== "" &&
      normalizeEmail(trimmedEmail) === subscribedEmail.value
    ) {
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

    try {
      const fd = new FormData();
      fd.append("email_address", trimmedEmail);
      const res = await fetch(KIT_FORM_ACTION, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
        signal: requestTimeoutSignal(),
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
    }

    status.value = "success";
    subscribedEmail.value = normalizeEmail(trimmedEmail);
    trackEvent(SUBSCRIBE_EVENT);
  }

  return { email, status, errorMessage, subscribe };
}
