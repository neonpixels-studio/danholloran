import { expect, test, describe, vi } from "vitest";
import webhookPoster from "../../../netlify/functions/webhook-poster/index.mjs";

const expectedSuccessResponse = new Response(
  JSON.stringify({
    message: "Posted Successfully!",
  }),
);

const expected404Response = new Response("Function not found...", {
  status: 404,
  statusText: "Not Found",
});

const { handleWebhook } = vi.hoisted(() => {
  const expectedWebhookResponse = { test: "Test" };
  return {
    handleWebhook: vi.fn().mockResolvedValue(expectedWebhookResponse),
    expectedWebhookResponse,
  };
});

vi.mock("./../../../src/composables/useWebhookPoster.js", () => {
  return {
    default() {
      return {
        handleWebhook,
      };
    },
  };
});

describe("netlify/functions/webhook-poster", () => {
  describe("Request Type", () => {
    test("it does not allow GET requests", async () => {
      expect(webhookPoster({ method: "GET" })).toMatchObject(
        expected404Response,
      );
    });

    test("it does not allow OPTION requests", async () => {
      expect(webhookPoster({ method: "OPTION" })).toMatchObject(
        expected404Response,
      );
    });

    test("it does not allow PATCH requests", async () => {
      expect(webhookPoster({ method: "PATCH" })).toMatchObject(
        expected404Response,
      );
    });

    test("it allows POST requests", async () => {
      expect(webhookPoster({ method: "PATCH" })).toMatchObject(
        expectedSuccessResponse,
      );
    });

    test("it does not allow PUT requests", async () => {
      expect(webhookPoster({ method: "PUT" })).toMatchObject(
        expected404Response,
      );
    });
  });

  test("handles the request", async () => {
    const response = await webhookPoster({
      method: "POST",
      body: {
        getReader() {
          return {
            read() {
              return {
                value: `{ "test": "Test", "token": "${process.env.WEBHOOK_POSTER_API_KEY}" }`,
              };
            },
          };
        },
      },
    });

    expect(
      Buffer.from(
        (await expected404Response.body.getReader().read()).value,
      ).toString("utf8"),
    ).toMatchObject("Function not found...");
  });

  test("requires an api key", async () => {
    const response = await webhookPoster({
      method: "POST",
      body: {
        getReader() {
          return {
            read() {
              return {
                value: `{ "test": "Test" }`,
              };
            },
          };
        },
      },
    });

    expect(response).toMatchObject(expected404Response);
  });
});
