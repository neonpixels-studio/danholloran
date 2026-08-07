import { describe, it, expect, vi, afterEach } from "vitest";

import { useNewsletter } from "../../theme/composables/useNewsletter";

const VALID_EMAIL = "reader@example.com";

function mockFetchStatus(responseStatus: number) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() =>
      Promise.resolve(new Response(null, { status: responseStatus })),
    );
}

function deferredResponse() {
  let resolveFetch!: (_response: Response) => void;
  const promise = new Promise<Response>((resolve) => {
    resolveFetch = resolve;
  });
  return { promise, resolveFetch };
}

describe("useNewsletter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects an invalid email without calling the API", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("fetch should not be called"));
    const { email, status, errorMessage, subscribe } = useNewsletter();

    email.value = "not-an-email";
    await subscribe();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(status.value).toBe("error");
    expect(errorMessage.value).toBe("enter a valid email address.");
  });

  it("posts once and reports success on a single submit", async () => {
    const fetchMock = mockFetchStatus(200);
    const { email, status, subscribe } = useNewsletter();

    email.value = VALID_EMAIL;
    await subscribe();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(status.value).toBe("success");

    const [url, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    const body = init?.body as FormData;
    expect(url).toBe("https://app.kit.com/forms/9565549/subscriptions");
    expect(init?.method).toBe("POST");
    expect(headers.Accept).toBe("application/json");
    expect(body.get("email_address")).toBe(VALID_EMAIL);
  });

  it("trims surrounding whitespace before validating and posting", async () => {
    const fetchMock = mockFetchStatus(200);
    const { email, status, subscribe } = useNewsletter();

    email.value = `  ${VALID_EMAIL}  `;
    await subscribe();

    expect(status.value).toBe("success");
    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(body.get("email_address")).toBe(VALID_EMAIL);
  });

  it("ignores a second submit while the first is in flight", async () => {
    const { promise, resolveFetch } = deferredResponse();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockReturnValue(promise);
    const { email, status, subscribe } = useNewsletter();

    email.value = VALID_EMAIL;
    const firstCall = subscribe();
    expect(status.value).toBe("loading");

    const secondCall = subscribe();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch(new Response(null, { status: 200 }));
    await Promise.all([firstCall, secondCall]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(status.value).toBe("success");
  });

  it("releases the guard after a failed request so a retry can succeed", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { email, status, subscribe } = useNewsletter();

    email.value = VALID_EMAIL;
    await subscribe();
    expect(status.value).toBe("error");

    await subscribe();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(status.value).toBe("success");
  });

  it("reports an error when the API responds with a non-ok status", async () => {
    mockFetchStatus(500);
    const { email, status, errorMessage, subscribe } = useNewsletter();

    email.value = VALID_EMAIL;
    await subscribe();

    expect(status.value).toBe("error");
    expect(errorMessage.value).toBe("something went wrong — please try again.");
  });

  it("releases the guard after a network failure so a retry can succeed", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { email, status, errorMessage, subscribe } = useNewsletter();

    email.value = VALID_EMAIL;
    await subscribe();
    expect(status.value).toBe("error");
    expect(errorMessage.value).toBe("network error — please try again.");

    await subscribe();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(status.value).toBe("success");
    expect(errorMessage.value).toBe("");
  });
});
