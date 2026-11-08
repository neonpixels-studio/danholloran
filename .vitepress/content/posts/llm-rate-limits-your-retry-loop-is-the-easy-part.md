---
date: "2026-11-07T16:23:40.000-08:00"
tags: ["ai", "llm", "typescript", "rate-limits"]
draft: false
title: "LLM Rate Limits: Your Retry Loop Is the Easy Part"
image: "/images/posts/llm-rate-limits-your-retry-loop-is-the-easy-part.jpg"
topic: "ai"
description: "Not every 429 is worth retrying. How to handle LLM API rate limits without stacking retries, burning budget on spend-cap errors, or discovering your limits by failing."
---

The first time an LLM feature hits real traffic, the logs fill with 429s and somebody writes a retry loop. It usually looks like the one from the last REST API they integrated: catch the error, sleep, try again, maybe double the sleep. It ships, the errors drop, and everyone moves on.

Then the bill arrives, or a batch job takes four times longer than it should, or the app keeps hammering the API for an hour after the account ran out of budget. The retry loop was never the hard part. Rate limits on LLM APIs behave differently from a typical REST API, and handling them well is mostly about not retrying when it won't help, and not sending the request in the first place when you already know it will fail.

The examples below use the Anthropic TypeScript SDK (`@anthropic-ai/sdk`), but the ideas carry over to any provider.

## Your SDK already retries, so don't stack another loop on top

Most official LLM SDKs ship with built-in retries. The Anthropic TypeScript SDK retries connection errors, 408, 409, 429, and 5xx responses twice by default, with a short exponential backoff. That covers transient blips, including the `529 overloaded_error` the API returns when it is under heavy load.

The mistake is wrapping that in your own retry loop. Three attempts from your code times three attempts from the SDK is nine requests per call, and under real load that turns a brief slowdown into a stampede. Pick one layer to own retries. For interactive requests, the SDK default is usually fine. For background jobs, raise it per request instead of writing a wrapper:

```ts
import Anthropic from "@anthropic-ai/sdk";

// Interactive traffic: fail fast, let the UI show a "try again" state
const client = new Anthropic({ maxRetries: 1, timeout: 30_000 });

// Background job: more patience on this call only
const summary = await client.messages.create(
  {
    model: "claude-sonnet-5-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: "Summarize this changelog..." }],
  },
  { maxRetries: 5 },
);
```

## Not every 429 is a rate limit

This is the trap. On the Claude API, a 429 with error type `rate_limit_error` can mean two very different things:

- **You exceeded a per-minute limit** (requests, input tokens, or output tokens). The response usually carries a `retry-after` header with the number of seconds to wait. Retrying after that delay works.
- **Your organization hit its monthly spend cap.** Same status code, same error type, but no `retry-after` header, and `error.details.error_code` is `enforced_spend_limit_reached`. Access comes back at the start of the next month or when the cap is raised. Every retry, including the SDK's automatic ones, fails.

A naive loop treats both the same and burns through retries, logs, and queue time on a request that cannot succeed. Classify before you retry:

```ts
type Outcome = "retry-later" | "stop" | "fail";

function classify(err: unknown): Outcome {
  if (!(err instanceof Anthropic.APIError)) return "fail";

  if (err.status === 429) {
    const body = err.error as { error?: { details?: { error_code?: string } } };
    if (body?.error?.details?.error_code === "enforced_spend_limit_reached") {
      return "stop"; // page someone; do not requeue
    }
    return "retry-later";
  }

  if (err.status === 529 || (err.status ?? 0) >= 500) return "retry-later";
  return "fail"; // 400s are bugs in your request, not capacity problems
}
```

`stop` should pause the whole worker and alert a human. `retry-later` should put the job back on a queue with a delay, not spin in a tight loop. Note that a spend limit you set yourself, below the tier cap, comes back as a 400 `invalid_request_error`, which this function correctly treats as non-retryable.

## Read the headers before you hit the wall

Retries are reactive. LLM APIs also tell you, on every successful response, how close you are to the limit. The Claude API returns headers such as `anthropic-ratelimit-requests-remaining`, `anthropic-ratelimit-input-tokens-remaining`, and `anthropic-ratelimit-output-tokens-remaining`, each with a matching `-reset` timestamp.

Two details matter here. First, the API uses a token bucket, so capacity refills continuously rather than resetting on the minute. A limit of 60 requests per minute can be enforced as roughly one per second, which means bursts get rejected even when your per-minute total looks fine. Second, input tokens read from the prompt cache do not count toward the input-tokens-per-minute limit. If you send the same large system prompt on every call, caching it is often the cheapest way to raise your effective throughput.

You can read the headers with `.withResponse()` and use them to throttle a concurrency limiter:

```ts
let maxInFlight = 8;

async function call(params: Anthropic.MessageCreateParams) {
  const { data, response } = await client.messages
    .create({ ...params, stream: false })
    .withResponse();

  const remaining = Number(
    response.headers.get("anthropic-ratelimit-input-tokens-remaining") ??
      Infinity,
  );
  // Back off concurrency as headroom shrinks, recover slowly when it returns
  if (remaining < 50_000)
    maxInFlight = Math.max(1, Math.floor(maxInFlight / 2));
  else if (maxInFlight < 8) maxInFlight += 1;

  return data;
}
```

Feed `maxInFlight` into whatever queue or semaphore runs your jobs. This is crude, but it shifts you from "discover the limit by failing" to "slow down as you approach it," which is what keeps tail latency sane.

## The takeaway

Treat rate limits as a capacity-planning signal, not an error to swallow. Let one layer own retries, separate "wait and try again" from "stop, nothing will work," and use the response headers to slow down before the API makes you. Sometimes the right fix is not code at all: batch APIs, prompt caching, or a smaller model for the easy requests can remove the pressure entirely. The provider's rate-limits page is worth reading end to end once, because the edge cases live in the footnotes.
