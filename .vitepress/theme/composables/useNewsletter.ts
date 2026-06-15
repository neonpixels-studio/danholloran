import { ref } from "vue";

const KIT_FORM_ACTION = "https://app.kit.com/forms/9565549/subscriptions";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterStatus = "idle" | "loading" | "success" | "error";

export function useNewsletter() {
  const email = ref("");
  const status = ref<NewsletterStatus>("idle");
  const errorMessage = ref("");

  async function subscribe() {
    const trimmedEmail = email.value.trim();
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
      });
      if (res.ok) {
        status.value = "success";
      } else {
        status.value = "error";
        errorMessage.value = "something went wrong — please try again.";
      }
    } catch {
      status.value = "error";
      errorMessage.value = "network error — please try again.";
    }
  }

  return { email, status, errorMessage, subscribe };
}
