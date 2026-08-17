import { ref } from "vue";

const SUBMIT_PATH = "/";
const FORM_NAME = "contact_form";
// Bounds the Netlify Forms request so a hung connection aborts and re-enables
// the form instead of pinning status at "loading" until a page reload.
const REQUEST_TIMEOUT_MS = 10_000;

const ALL_FIELDS_MESSAGE = "Please fill in all fields before sending.";
const SUCCESS_MESSAGE = "Message sent — I'll be in touch soon.";
const ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE = "Network error. Please try again.";

// Undefined on browsers without AbortSignal.timeout so the request stays
// unbounded (as before) rather than throwing and failing every submit.
function requestTimeoutSignal(): AbortSignal | undefined {
  if (
    typeof AbortSignal === "undefined" ||
    typeof AbortSignal.timeout !== "function"
  ) {
    return undefined;
  }
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
}

export type ContactStatus = "idle" | "loading" | "success" | "error";

export function useContact() {
  const name = ref("");
  const email = ref("");
  const message = ref("");
  const status = ref<ContactStatus>("idle");
  const statusMessage = ref("");

  async function submit() {
    // One request at a time.
    if (status.value === "loading") {
      return;
    }

    const trimmedName = name.value.trim();
    const trimmedEmail = email.value.trim();
    const trimmedMessage = message.value.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      status.value = "error";
      statusMessage.value = ALL_FIELDS_MESSAGE;
      return;
    }

    status.value = "loading";
    statusMessage.value = "";

    try {
      const body = new URLSearchParams({
        "form-name": FORM_NAME,
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      });
      const res = await fetch(SUBMIT_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: requestTimeoutSignal(),
      });
      if (!res.ok) {
        status.value = "error";
        statusMessage.value = ERROR_MESSAGE;
        return;
      }
    } catch {
      status.value = "error";
      statusMessage.value = NETWORK_ERROR_MESSAGE;
      return;
    }

    status.value = "success";
    statusMessage.value = SUCCESS_MESSAGE;
    name.value = "";
    email.value = "";
    message.value = "";
  }

  return { name, email, message, status, statusMessage, submit };
}
