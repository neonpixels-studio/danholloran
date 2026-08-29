import { describe, it, expect, vi, afterEach, type MockInstance } from "vitest";
import { useContact } from "../../theme/composables/useContact";

const SUBMIT_PATH = "/";
const FORM_NAME = "contact_form";
const BOT_FIELD = "bot-field";
const TIMEOUT_MS = 10_000;

const ALL_FIELDS_MESSAGE = "Please fill in all fields before sending.";
const SUCCESS_MESSAGE = "Message sent — I'll be in touch soon.";
const ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE = "Network error. Please try again.";

const VALID_FIELDS = {
  name: "Dan",
  email: "dan@example.com",
  message: "Hello there, this is a message.",
};

function okResponse(ok: boolean): Response {
  return { ok } as Response;
}

function stubFetch(ok: boolean): MockInstance {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(okResponse(ok));
}

function fill(
  contact: ReturnType<typeof useContact>,
  { name = "", email = "", message = "" } = {},
) {
  contact.name.value = name;
  contact.email.value = email;
  contact.message.value = message;
}

function fieldInput(fieldName: string, value: string): HTMLInputElement {
  const input = document.createElement("input");
  input.name = fieldName;
  input.value = value;
  return input;
}

// Mirrors the real contact form markup so `new FormData(form)` sees the same
// fields the browser would submit, including the honeypot.
function contactForm({
  name = "",
  email = "",
  message = "",
  botField = "",
} = {}): HTMLFormElement {
  const form = document.createElement("form");
  form.append(
    fieldInput("form-name", FORM_NAME),
    fieldInput("name", name),
    fieldInput("email", email),
    fieldInput("message", message),
    fieldInput(BOT_FIELD, botField),
  );
  return form;
}

function submitEvent(fields = {}): SubmitEvent {
  return { currentTarget: contactForm(fields) } as unknown as SubmitEvent;
}

// The composable reads the form for validation and the payload; the refs only
// mirror v-model for display and reset. Populate both so a submit matches the
// live component, where they are always in sync.
function submitWith(
  contact: ReturnType<typeof useContact>,
  fields = {},
): Promise<void> {
  fill(contact, fields);
  return contact.submit(submitEvent(fields));
}

function deferredResponse() {
  let resolveFetch!: (_response: Response) => void;
  const promise = new Promise<Response>((resolve) => {
    resolveFetch = resolve;
  });
  return { promise, resolveFetch };
}

type FetchArgs = Parameters<typeof fetch>;

// Rejects when the request's own signal aborts. Fails fast if `signal:` is
// dropped so the suite doesn't hang on the test timeout.
function abortRejectingFetch() {
  return (_url: FetchArgs[0], init?: FetchArgs[1]): Promise<Response> => {
    if (!init?.signal) {
      return Promise.reject(
        new Error("fetch was called without a timeout signal"),
      );
    }
    return new Promise((_resolve, reject) => {
      const rejectAsTimedOut = () => {
        reject(new DOMException("timed out", "TimeoutError"));
      };
      if (init.signal.aborted) {
        rejectAsTimedOut();
        return;
      }
      init.signal.addEventListener("abort", rejectAsTimedOut);
    });
  };
}

// Covers all-blank plus each field individually empty or whitespace-only, so a
// dropped guard OR a dropped trim on any single field fails a test.
const INCOMPLETE_FIELD_SETS = [
  { name: "", email: "", message: "" },
  { name: "   ", email: "  ", message: "   " },
  { name: "", email: VALID_FIELDS.email, message: VALID_FIELDS.message },
  { name: "   ", email: VALID_FIELDS.email, message: VALID_FIELDS.message },
  { name: VALID_FIELDS.name, email: "", message: VALID_FIELDS.message },
  { name: VALID_FIELDS.name, email: "   ", message: VALID_FIELDS.message },
  { name: VALID_FIELDS.name, email: VALID_FIELDS.email, message: "" },
  { name: VALID_FIELDS.name, email: VALID_FIELDS.email, message: "   " },
];

describe("useContact", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("required field validation", () => {
    it.each(INCOMPLETE_FIELD_SETS)(
      "rejects %j without calling fetch",
      async (fields) => {
        const fetchSpy = stubFetch(true);
        const contact = useContact();

        await submitWith(contact, fields);

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(contact.status.value).toBe("error");
        expect(contact.statusMessage.value).toBe(ALL_FIELDS_MESSAGE);
      },
    );

    it("proceeds to fetch when every field is filled in", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("form element requirement", () => {
    it("rejects when the refs are filled but the submitted form is empty", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      fill(contact, VALID_FIELDS);
      await contact.submit(submitEvent());

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(contact.status.value).toBe("error");
      expect(contact.statusMessage.value).toBe(ALL_FIELDS_MESSAGE);
    });

    it("errors without calling fetch when the event carries no form element", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      const event = {
        currentTarget: document.createElement("div"),
      } as unknown as SubmitEvent;
      await contact.submit(event);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(contact.status.value).toBe("error");
      expect(contact.statusMessage.value).toBe(ERROR_MESSAGE);
    });

    it("errors without calling fetch when invoked without an event", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      // Out of contract (the signature requires an event); the runtime backstop
      // still fails safe rather than throwing.
      await (contact.submit as () => Promise<void>)();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(contact.status.value).toBe("error");
      expect(contact.statusMessage.value).toBe(ERROR_MESSAGE);
    });

    it("errors without a false success when form-name is missing from the markup", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      const form = document.createElement("form");
      form.append(
        fieldInput("name", VALID_FIELDS.name),
        fieldInput("email", VALID_FIELDS.email),
        fieldInput("message", VALID_FIELDS.message),
      );
      const event = { currentTarget: form } as unknown as SubmitEvent;
      await contact.submit(event);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(contact.status.value).toBe("error");
      expect(contact.statusMessage.value).toBe(ERROR_MESSAGE);
    });
  });

  describe("instance isolation", () => {
    it("gives each caller independent state", () => {
      const first = useContact();
      const second = useContact();

      first.name.value = "Dan";
      first.status.value = "loading";

      expect(second.name.value).toBe("");
      expect(second.status.value).toBe("idle");
    });
  });

  describe("the fetch call", () => {
    it("POSTs url-encoded fields to the Netlify Forms path", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe(SUBMIT_PATH);
      expect(init?.method).toBe("POST");
      expect(init?.headers).toEqual({
        "Content-Type": "application/x-www-form-urlencoded",
      });
      const params = new URLSearchParams(init?.body as string);
      expect(params.get("form-name")).toBe(FORM_NAME);
      expect(params.get("name")).toBe(VALID_FIELDS.name);
      expect(params.get("email")).toBe(VALID_FIELDS.email);
      expect(params.get("message")).toBe(VALID_FIELDS.message);
    });

    it("forwards the bot-field honeypot so the JS path is protected too", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      fill(contact, VALID_FIELDS);
      await contact.submit(
        submitEvent({ ...VALID_FIELDS, botField: "i-am-a-bot" }),
      );

      const params = new URLSearchParams(
        fetchSpy.mock.calls[0][1]?.body as string,
      );
      expect(params.get(BOT_FIELD)).toBe("i-am-a-bot");
    });

    it("forwards a whitespace-only honeypot raw so it still trips the filter", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      fill(contact, VALID_FIELDS);
      await contact.submit(submitEvent({ ...VALID_FIELDS, botField: "   " }));

      const params = new URLSearchParams(
        fetchSpy.mock.calls[0][1]?.body as string,
      );
      expect(params.get(BOT_FIELD)).toBe("   ");
    });

    it("reads the submitted form, not the composable refs", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      // Refs left empty on purpose; only the form carries the values, proving
      // the form is what gets validated and sent.
      await contact.submit(submitEvent(VALID_FIELDS));

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const params = new URLSearchParams(
        fetchSpy.mock.calls[0][1]?.body as string,
      );
      expect(params.get("name")).toBe(VALID_FIELDS.name);
      expect(params.get("email")).toBe(VALID_FIELDS.email);
      expect(params.get("message")).toBe(VALID_FIELDS.message);
    });

    it("trims surrounding whitespace before sending", async () => {
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      await submitWith(contact, {
        name: "  Dan  ",
        email: "  dan@example.com  ",
        message: "  Hello there  ",
      });

      const params = new URLSearchParams(
        fetchSpy.mock.calls[0][1]?.body as string,
      );
      expect(params.get("name")).toBe("Dan");
      expect(params.get("email")).toBe("dan@example.com");
      expect(params.get("message")).toBe("Hello there");
    });
  });

  describe("state transitions", () => {
    it("moves to loading and clears a prior message while in flight", async () => {
      const { promise, resolveFetch } = deferredResponse();
      vi.spyOn(globalThis, "fetch").mockReturnValue(promise);

      const contact = useContact();
      contact.statusMessage.value = "stale message";

      const settled = submitWith(contact, VALID_FIELDS);
      expect(contact.status.value).toBe("loading");
      expect(contact.statusMessage.value).toBe("");

      resolveFetch(okResponse(true));
      await settled;
      expect(contact.status.value).toBe("success");
    });

    it("moves to success and clears the fields when the response is ok", async () => {
      stubFetch(true);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      expect(contact.status.value).toBe("success");
      expect(contact.statusMessage.value).toBe(SUCCESS_MESSAGE);
      expect(contact.name.value).toBe("");
      expect(contact.email.value).toBe("");
      expect(contact.message.value).toBe("");
    });

    it("moves to error with a retry message when the response is not ok", async () => {
      stubFetch(false);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      expect(contact.status.value).toBe("error");
      expect(contact.statusMessage.value).toBe(ERROR_MESSAGE);
    });

    it("keeps the entered fields intact when the response is not ok", async () => {
      stubFetch(false);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      expect(contact.name.value).toBe(VALID_FIELDS.name);
      expect(contact.email.value).toBe(VALID_FIELDS.email);
      expect(contact.message.value).toBe(VALID_FIELDS.message);
    });

    it("moves to error with a network message and keeps the fields when fetch throws", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      expect(contact.status.value).toBe("error");
      expect(contact.statusMessage.value).toBe(NETWORK_ERROR_MESSAGE);
      expect(contact.name.value).toBe(VALID_FIELDS.name);
      expect(contact.email.value).toBe(VALID_FIELDS.email);
      expect(contact.message.value).toBe(VALID_FIELDS.message);
    });
  });

  describe("in-flight guard", () => {
    it("ignores a second submit while the first is in flight", async () => {
      const { promise, resolveFetch } = deferredResponse();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockReturnValue(promise);
      const contact = useContact();

      const firstCall = submitWith(contact, VALID_FIELDS);
      expect(contact.status.value).toBe("loading");

      // Valid form so only the in-flight guard — not validation — can stop it.
      const secondCall = contact.submit(submitEvent(VALID_FIELDS));
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      resolveFetch(okResponse(true));
      await Promise.all([firstCall, secondCall]);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(contact.status.value).toBe("success");
    });

    it("releases the guard after a failed request so a retry can succeed", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(okResponse(false))
        .mockResolvedValueOnce(okResponse(true));
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);
      expect(contact.status.value).toBe("error");

      await submitWith(contact, VALID_FIELDS);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(contact.status.value).toBe("success");
    });

    it("releases the guard after a network failure so a retry can succeed", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce(okResponse(true));
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);
      expect(contact.status.value).toBe("error");
      expect(contact.statusMessage.value).toBe(NETWORK_ERROR_MESSAGE);

      await submitWith(contact, VALID_FIELDS);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(contact.status.value).toBe("success");
    });
  });

  describe("request timeout", () => {
    it("bounds the fetch with an AbortSignal set to the request timeout", async () => {
      const timeoutSignal = new AbortController().signal;
      const timeoutSpy = vi
        .spyOn(AbortSignal, "timeout")
        .mockReturnValue(timeoutSignal);
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      expect(timeoutSpy).toHaveBeenCalledWith(TIMEOUT_MS);
      const [, init] = fetchSpy.mock.calls[0];
      expect(init?.signal).toBe(timeoutSignal);
    });

    it("routes an aborted (timed-out) request to the network-error branch and unlocks the form", async () => {
      const timeoutController = new AbortController();
      const timeoutSpy = vi
        .spyOn(AbortSignal, "timeout")
        .mockReturnValueOnce(timeoutController.signal)
        .mockReturnValueOnce(new AbortController().signal);
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockImplementationOnce(abortRejectingFetch())
        .mockImplementationOnce((_url, init) => {
          if (init?.signal?.aborted) {
            return Promise.reject(new DOMException("aborted", "AbortError"));
          }
          return Promise.resolve(okResponse(true));
        });
      const contact = useContact();

      const settled = submitWith(contact, VALID_FIELDS);
      expect(contact.status.value).toBe("loading");

      timeoutController.abort(new DOMException("timed out", "TimeoutError"));
      await settled;
      expect(contact.status.value).toBe("error");
      expect(contact.statusMessage.value).toBe(NETWORK_ERROR_MESSAGE);

      await submitWith(contact, VALID_FIELDS);
      expect(timeoutSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(contact.status.value).toBe("success");
    });

    it("bounds the fetch with a fallback signal when AbortSignal.timeout is unavailable", async () => {
      vi.stubGlobal("AbortSignal", {});
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      const fallbackSignal = fetchSpy.mock.calls[0][1]?.signal;
      expect(fallbackSignal).toBeDefined();
      expect(fallbackSignal?.aborted).toBe(false);
      expect(contact.status.value).toBe("success");
    });

    it("cancels the fallback timer once a successful request settles", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("AbortSignal", {});
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      const fallbackSignal = fetchSpy.mock.calls[0][1]?.signal;
      expect(fallbackSignal).toBeDefined();
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(TIMEOUT_MS);
      expect(fallbackSignal?.aborted).toBe(false);
    });

    it("cancels the fallback timer when the response is not ok", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("AbortSignal", {});
      const fetchSpy = stubFetch(false);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      expect(fetchSpy.mock.calls[0][1]?.signal).toBeDefined();
      expect(contact.status.value).toBe("error");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("cancels the fallback timer when the request rejects", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("AbortSignal", {});
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new TypeError("Failed to fetch"));
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      expect(fetchSpy.mock.calls[0][1]?.signal).toBeDefined();
      expect(contact.status.value).toBe("error");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("aborts a hung request via the fallback timer when AbortSignal.timeout is unavailable", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("AbortSignal", {});
      vi.spyOn(globalThis, "fetch").mockImplementation(abortRejectingFetch());
      const contact = useContact();

      const settled = submitWith(contact, VALID_FIELDS);
      expect(contact.status.value).toBe("loading");

      vi.advanceTimersByTime(TIMEOUT_MS);
      await settled;

      expect(contact.status.value).toBe("error");
      expect(contact.statusMessage.value).toBe(NETWORK_ERROR_MESSAGE);
    });

    it("sends an unbounded request when neither AbortSignal.timeout nor AbortController exists", async () => {
      vi.stubGlobal("AbortSignal", undefined);
      vi.stubGlobal("AbortController", undefined);
      const fetchSpy = stubFetch(true);
      const contact = useContact();

      await submitWith(contact, VALID_FIELDS);

      expect(fetchSpy.mock.calls[0][1]?.signal).toBeUndefined();
      expect(contact.status.value).toBe("success");
    });
  });
});
