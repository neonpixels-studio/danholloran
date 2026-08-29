import { describe, it, expect, vi, afterEach, type MockInstance } from "vitest";
import { useNewsletter } from "../../theme/composables/useNewsletter";

const KIT_FORM_ACTION = "https://app.kit.com/forms/9565549/subscriptions";
const VALID_EMAIL = "reader@example.com";
const SUBSCRIBE_EVENT = "newsletter_subscribe";
const TIMEOUT_MS = 10_000;

function okResponse(ok: boolean): Response {
  return { ok } as Response;
}

function stubFetch(ok: boolean): MockInstance {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(okResponse(ok));
}

function mockGtag() {
  const gtag = vi.fn();
  (globalThis as unknown as { gtag: typeof gtag }).gtag = gtag;
  return gtag;
}

function mockThrowingGtag() {
  const gtag = vi.fn(() => {
    throw new Error("gtag blew up");
  });
  (globalThis as unknown as { gtag: typeof gtag }).gtag = gtag;
  return gtag;
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
// dropped so the suite doesn't hang on the test timeout; the actual regression
// detection lives in the explicit assertions below, not this message.
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

// Each pins a different constraint of EMAIL_RE so loosening the regex fails a test.
const INVALID_EMAILS = [
  "",
  "not-an-email", // no @
  "foo@bar", // no dot after the @
  "reader@", // nothing after the @
  "@example.com", // nothing before the @
  "foo bar@example.com", // internal whitespace
  "a@b@c.com", // a second @
];

const VALID_EMAILS = [VALID_EMAIL, "a+tag@sub.example.co.uk"];

describe("useNewsletter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete (globalThis as unknown as { gtag?: unknown }).gtag;
  });

  describe("email validation", () => {
    it.each(INVALID_EMAILS)(
      "rejects %j without calling fetch",
      async (invalidEmail) => {
        const fetchSpy = stubFetch(true);
        const { email, status, errorMessage, subscribe } = useNewsletter();

        email.value = invalidEmail;
        await subscribe();

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(status.value).toBe("error");
        expect(errorMessage.value).toBe("enter a valid email address.");
      },
    );

    it.each(VALID_EMAILS)(
      "accepts %j and proceeds to fetch",
      async (validEmail) => {
        const fetchSpy = stubFetch(true);
        const { email, subscribe } = useNewsletter();

        email.value = validEmail;
        await subscribe();

        expect(fetchSpy).toHaveBeenCalledTimes(1);
      },
    );

    it("trims surrounding whitespace before validating and sending", async () => {
      const fetchSpy = stubFetch(true);
      const { email, subscribe } = useNewsletter();

      email.value = `  ${VALID_EMAIL}  `;
      await subscribe();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const sentBody = fetchSpy.mock.calls[0][1]?.body as FormData;
      expect(sentBody.get("email_address")).toBe(VALID_EMAIL);
    });
  });

  describe("the fetch call", () => {
    it("POSTs FormData to the Kit form action with the JSON Accept header", async () => {
      const fetchSpy = stubFetch(true);
      const { email, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe(KIT_FORM_ACTION);
      expect(init?.method).toBe("POST");
      expect(init?.headers).toEqual({ Accept: "application/json" });
      expect(init?.body).toBeInstanceOf(FormData);
      expect((init?.body as FormData).get("email_address")).toBe(VALID_EMAIL);
    });
  });

  describe("state transitions", () => {
    it("moves to loading and clears a prior error while the request is in flight", async () => {
      const { promise, resolveFetch } = deferredResponse();
      vi.spyOn(globalThis, "fetch").mockReturnValue(promise);

      const { email, status, errorMessage, subscribe } = useNewsletter();
      errorMessage.value = "stale error";
      email.value = VALID_EMAIL;

      const settled = subscribe();
      expect(status.value).toBe("loading");
      expect(errorMessage.value).toBe("");

      resolveFetch(okResponse(true));
      await settled;
      expect(status.value).toBe("success");
    });

    it("moves to success when the response is ok", async () => {
      stubFetch(true);
      const { email, status, errorMessage, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(status.value).toBe("success");
      expect(errorMessage.value).toBe("");
    });

    it("moves to error with a retry message when the response is not ok", async () => {
      stubFetch(false);
      const { email, status, errorMessage, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(status.value).toBe("error");
      expect(errorMessage.value).toBe(
        "something went wrong — please try again.",
      );
    });

    it("moves to error with a network message when fetch throws", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
      const { email, status, errorMessage, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(status.value).toBe("error");
      expect(errorMessage.value).toBe("network error — please try again.");
    });
  });

  describe("in-flight guard", () => {
    it("ignores a second submit while the first is in flight", async () => {
      const { promise, resolveFetch } = deferredResponse();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockReturnValue(promise);
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      const firstCall = subscribe();
      expect(status.value).toBe("loading");

      const secondCall = subscribe();
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      resolveFetch(okResponse(true));
      await Promise.all([firstCall, secondCall]);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(status.value).toBe("success");
    });

    it("re-enables the form after success when the email is changed to a new address", async () => {
      const fetchSpy = stubFetch(true);
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();
      expect(status.value).toBe("success");
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      email.value = "second@example.com";
      await subscribe();

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(status.value).toBe("success");
    });

    it("keeps the success lock for a whitespace-only re-type of the subscribed address", async () => {
      const fetchSpy = stubFetch(true);
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      email.value = `  ${VALID_EMAIL}  `;
      await subscribe();

      expect(status.value).toBe("success");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("keeps the success lock for a case-only re-type of the subscribed address", async () => {
      const fetchSpy = stubFetch(true);
      const { email, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      email.value = VALID_EMAIL.toUpperCase();
      await subscribe();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("clears a stale error when re-affirming the subscribed address after a failed edit", async () => {
      const fetchSpy = stubFetch(true);
      const { email, status, errorMessage, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      email.value = "not-an-email";
      await subscribe();
      expect(status.value).toBe("error");
      expect(errorMessage.value).toBe("enter a valid email address.");

      email.value = VALID_EMAIL;
      await subscribe();

      expect(status.value).toBe("success");
      expect(errorMessage.value).toBe("");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("does not re-POST after editing away and back to the subscribed address without submitting", async () => {
      const fetchSpy = stubFetch(true);
      const { email, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      email.value = "other@example.com";
      email.value = VALID_EMAIL;
      await subscribe();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("releases the guard after a failed request so a retry can succeed", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(okResponse(false))
        .mockResolvedValueOnce(okResponse(true));
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();
      expect(status.value).toBe("error");

      await subscribe();
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(status.value).toBe("success");
    });

    it("releases the guard after a network failure so a retry can succeed", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce(okResponse(true));
      const { email, status, errorMessage, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();
      expect(status.value).toBe("error");
      expect(errorMessage.value).toBe("network error — please try again.");

      await subscribe();
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(status.value).toBe("success");
      expect(errorMessage.value).toBe("");
    });
  });

  describe("isSubscribedAddress", () => {
    it("is false before any successful subscribe", () => {
      const { email, isSubscribedAddress } = useNewsletter();

      email.value = VALID_EMAIL;

      expect(isSubscribedAddress.value).toBe(false);
    });

    it("is true while the entered address matches the one that succeeded", async () => {
      stubFetch(true);
      const { email, isSubscribedAddress, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(isSubscribedAddress.value).toBe(true);
    });

    it("stays true for a case/whitespace-only re-type of the subscribed address", async () => {
      stubFetch(true);
      const { email, isSubscribedAddress, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      email.value = `  ${VALID_EMAIL.toUpperCase()}  `;

      expect(isSubscribedAddress.value).toBe(true);
    });

    it("flips false when the visitor edits to a different address so the form re-opens", async () => {
      stubFetch(true);
      const { email, isSubscribedAddress, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      email.value = "second@example.com";

      expect(isSubscribedAddress.value).toBe(false);
    });

    it("stays locked for any address subscribed this session, not just the most recent", async () => {
      const fetchSpy = stubFetch(true);
      const { email, isSubscribedAddress, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();
      email.value = "second@example.com";
      await subscribe();
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // Re-typing the first address must not re-POST or re-open the button.
      email.value = VALID_EMAIL;
      expect(isSubscribedAddress.value).toBe(true);
      await subscribe();
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("request timeout", () => {
    it("bounds the fetch with an AbortSignal set to the request timeout", async () => {
      const timeoutSignal = new AbortController().signal;
      const timeoutSpy = vi
        .spyOn(AbortSignal, "timeout")
        .mockReturnValue(timeoutSignal);
      const fetchSpy = stubFetch(true);
      const { email, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(timeoutSpy).toHaveBeenCalledWith(TIMEOUT_MS);
      const [, init] = fetchSpy.mock.calls[0];
      expect(init?.signal).toBe(timeoutSignal);
    });

    it("routes an aborted (timed-out) request to the network-error branch and unlocks the form", async () => {
      const timeoutController = new AbortController();
      // A fresh signal per attempt: reuse the first (aborted) one and the retry rejects.
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
      const { email, status, errorMessage, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      const settled = subscribe();
      expect(status.value).toBe("loading");

      timeoutController.abort(new DOMException("timed out", "TimeoutError"));
      await settled;
      expect(status.value).toBe("error");
      expect(errorMessage.value).toBe("network error — please try again.");

      await subscribe();
      expect(timeoutSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(status.value).toBe("success");
      expect(errorMessage.value).toBe("");
    });

    it("bounds the request with a fallback signal when AbortSignal.timeout is unavailable", async () => {
      vi.stubGlobal("AbortSignal", {});
      const fetchSpy = stubFetch(true);
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      const fallbackSignal = fetchSpy.mock.calls[0][1]?.signal;
      expect(fallbackSignal).toBeDefined();
      expect(fallbackSignal?.aborted).toBe(false);
      expect(status.value).toBe("success");
    });

    it("cancels the fallback timer once a successful request settles", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("AbortSignal", {});
      const fetchSpy = stubFetch(true);
      const { email, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

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
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(fetchSpy.mock.calls[0][1]?.signal).toBeDefined();
      expect(status.value).toBe("error");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("cancels the fallback timer when the request rejects", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("AbortSignal", {});
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new TypeError("Failed to fetch"));
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(fetchSpy.mock.calls[0][1]?.signal).toBeDefined();
      expect(status.value).toBe("error");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("aborts a hung request via the fallback timer when AbortSignal.timeout is unavailable", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("AbortSignal", {});
      vi.spyOn(globalThis, "fetch").mockImplementation(abortRejectingFetch());
      const { email, status, errorMessage, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      const settled = subscribe();
      expect(status.value).toBe("loading");

      vi.advanceTimersByTime(TIMEOUT_MS);
      await settled;

      expect(status.value).toBe("error");
      expect(errorMessage.value).toBe("network error — please try again.");
    });

    it("sends an unbounded request when neither AbortSignal.timeout nor AbortController exists", async () => {
      vi.stubGlobal("AbortSignal", undefined);
      vi.stubGlobal("AbortController", undefined);
      const fetchSpy = stubFetch(true);
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(fetchSpy.mock.calls[0][1]?.signal).toBeUndefined();
      expect(status.value).toBe("success");
    });
  });

  describe("analytics", () => {
    it("fires exactly one analytics event on a successful subscribe", async () => {
      stubFetch(true);
      const gtag = mockGtag();
      const { email, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(gtag).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledWith("event", SUBSCRIBE_EVENT, {});
    });

    it("still reports success and warns in dev when the analytics call throws", async () => {
      vi.stubEnv("DEV", true);
      stubFetch(true);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockThrowingGtag();
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(status.value).toBe("success");
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("swallows a throwing analytics call silently outside dev", async () => {
      vi.stubEnv("DEV", false);
      stubFetch(true);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockThrowingGtag();
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(status.value).toBe("success");
      expect(warn).not.toHaveBeenCalled();
    });

    it("still reports success when gtag is absent", async () => {
      stubFetch(true);
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(status.value).toBe("success");
    });

    it("ignores a repeat submit after success, firing no second event or request", async () => {
      const fetchSpy = stubFetch(true);
      const gtag = mockGtag();
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();
      await subscribe();

      expect(status.value).toBe("success");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledTimes(1);
    });

    it("fires no analytics event when the API responds with a non-ok status", async () => {
      stubFetch(false);
      const gtag = mockGtag();
      const { email, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(gtag).not.toHaveBeenCalled();
    });

    it("fires no analytics event when the request throws", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new TypeError("Failed to fetch"),
      );
      const gtag = mockGtag();
      const { email, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();

      expect(gtag).not.toHaveBeenCalled();
    });

    it("fires no analytics event when the email is invalid", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("fetch should not be called"));
      const gtag = mockGtag();
      const { email, subscribe } = useNewsletter();

      email.value = "not-an-email";
      await subscribe();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(gtag).not.toHaveBeenCalled();
    });

    it("fires exactly one event when a second submit lands mid-flight", async () => {
      const { promise, resolveFetch } = deferredResponse();
      vi.spyOn(globalThis, "fetch").mockReturnValue(promise);
      const gtag = mockGtag();
      const { email, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      const firstCall = subscribe();
      const secondCall = subscribe();

      resolveFetch(okResponse(true));
      await Promise.all([firstCall, secondCall]);

      expect(gtag).toHaveBeenCalledTimes(1);
    });

    it("fires one event when a retry after an error succeeds", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(okResponse(false))
        .mockResolvedValueOnce(okResponse(true));
      const gtag = mockGtag();
      const { email, status, subscribe } = useNewsletter();

      email.value = VALID_EMAIL;
      await subscribe();
      await subscribe();

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(status.value).toBe("success");
      expect(gtag).toHaveBeenCalledTimes(1);
    });
  });
});
