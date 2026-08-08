import { describe, it, expect, vi, afterEach, type MockInstance } from "vitest";
import { useNewsletter } from "../../theme/composables/useNewsletter";

const KIT_FORM_ACTION = "https://app.kit.com/forms/9565549/subscriptions";
const VALID_EMAIL = "reader@example.com";

function okResponse(ok: boolean): Response {
  return { ok } as Response;
}

function stubFetch(ok: boolean): MockInstance {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(okResponse(ok));
}

function deferredResponse() {
  let resolveFetch!: (_response: Response) => void;
  const promise = new Promise<Response>((resolve) => {
    resolveFetch = resolve;
  });
  return { promise, resolveFetch };
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
});
