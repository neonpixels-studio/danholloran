import { ref } from "vue";
import { withTimeoutSignal } from "@utils/timeoutSignal";

const SUBMIT_PATH = "/";
// Netlify's honeypot: forwarded verbatim (never trimmed) so a whitespace-only
// bot fill still trips it, matching the native no-JS submit.
const HONEYPOT_FIELD = "bot-field";
// Netlify keys the submission to a form by this field; without it Netlify drops
// the POST while still returning 200, so the guard below treats it as required.
const FORM_NAME_FIELD = "form-name";
// Bounds the Netlify Forms request so a hung connection aborts and re-enables
// the form instead of pinning status at "loading" until a page reload.
const REQUEST_TIMEOUT_MS = 10_000;

const REQUIRED_FIELDS = ["name", "email", "message"] as const;

const ALL_FIELDS_MESSAGE = "Please fill in all fields before sending.";
const SUCCESS_MESSAGE = "Message sent — I'll be in touch soon.";
const ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE = "Network error. Please try again.";

// Serializes the live form so every field the markup declares — including the
// bot-field honeypot and the Netlify form-name — reaches Netlify Forms, keeping
// the JS payload's field set aligned with the no-JS submit. `append` preserves
// repeated field names; file inputs (never present on this form) are skipped.
// User-entered values are trimmed to normalize incidental whitespace (a
// deliberate divergence from the no-JS submit); the honeypot is forwarded raw so
// a whitespace-only bot fill still trips it.
function toRequestBody(formData: FormData): URLSearchParams {
  const body = new URLSearchParams();
  for (const [field, value] of formData.entries()) {
    if (typeof value !== "string") {
      continue;
    }
    body.append(field, field === HONEYPOT_FIELD ? value : value.trim());
  }
  return body;
}

type RequestResolution = { body: URLSearchParams } | { errorMessage: string };

// Resolves the submitted form into a validated request body, or the message to
// show when it can't. Pure and DOM-only, so it stays testable in isolation and
// keeps `submit` small.
function resolveRequestBody(event: SubmitEvent): RequestResolution {
  // Optional-chained as a runtime backstop; the signature already requires the
  // event, so a no-arg call is caught at compile time.
  const form = event?.currentTarget;
  if (!(form instanceof HTMLFormElement)) {
    return { errorMessage: ERROR_MESSAGE };
  }

  // Build the payload once and validate off it, so the fields we check are
  // exactly the fields we send — the form is the single source of truth.
  const body = toRequestBody(new FormData(form));
  // A missing form-name makes Netlify drop the POST while still returning 200;
  // guard so a markup regression never reports a false success.
  if (!body.get(FORM_NAME_FIELD)) {
    return { errorMessage: ERROR_MESSAGE };
  }
  if (REQUIRED_FIELDS.some((field) => !body.get(field))) {
    return { errorMessage: ALL_FIELDS_MESSAGE };
  }
  return { body };
}

export type ContactStatus = "idle" | "loading" | "success" | "error";

export function useContact() {
  const name = ref("");
  const email = ref("");
  const message = ref("");
  const status = ref<ContactStatus>("idle");
  const statusMessage = ref("");

  async function submit(event: SubmitEvent) {
    // One request at a time.
    if (status.value === "loading") {
      return;
    }

    const resolution = resolveRequestBody(event);
    if ("errorMessage" in resolution) {
      status.value = "error";
      statusMessage.value = resolution.errorMessage;
      return;
    }

    status.value = "loading";
    statusMessage.value = "";

    const timeout = withTimeoutSignal(REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(SUBMIT_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: resolution.body.toString(),
        signal: timeout.signal,
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
    } finally {
      timeout.clear();
    }

    status.value = "success";
    statusMessage.value = SUCCESS_MESSAGE;
    name.value = "";
    email.value = "";
    message.value = "";
  }

  return { name, email, message, status, statusMessage, submit };
}
