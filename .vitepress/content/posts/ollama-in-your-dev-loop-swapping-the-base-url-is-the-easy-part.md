---
date: "2026-11-13T02:14:38.000-08:00"
tags: ["ai", "local-llms", "llm", "typescript", "running-local-models"]
draft: false
title: "Ollama in Your Dev Loop: Swapping the Base URL Is the Easy Part"
image: "/images/posts/ollama-in-your-dev-loop-swapping-the-base-url-is-the-easy-part.jpg"
topic: "ai"
description: "Ollama speaks the OpenAI API, so pointing your app at a local model takes one line. The context window, feature gaps, and schema quirks are what bite."
---

Running a model locally sounds like the perfect fix for a handful of annoyances: no API bill while you iterate on a prompt, no customer data leaving your laptop, and a dev loop that works on a plane. Ollama makes the first step almost suspiciously easy. It serves an OpenAI-compatible endpoint on `localhost:11434`, so the official OpenAI SDK talks to it with a different `baseURL` and nothing else.

That one-line swap is real, and it is also where most people stop reading. The trouble shows up an hour later, when the local model "ignores" half your system prompt or a request that works against a hosted API throws a 400. Almost all of it comes from three places: the context window, the parts of the API Ollama does not implement, and how much you trust the output shape.

## The swap, done so you can undo it

Ollama's docs show the whole integration: point the client at `http://localhost:11434/v1/` and pass any string as the API key, because it is required by the SDK but ignored by the server. Do that through config rather than a code branch, so the same call site runs locally and in production:

```ts
import OpenAI from "openai";

const local = process.env.LLM_PROVIDER === "ollama";

export const llm = new OpenAI({
  baseURL: local ? "http://localhost:11434/v1/" : undefined,
  apiKey: local ? "ollama" : process.env.OPENAI_API_KEY,
});

export const MODEL = local ? "qwen3:8b" : process.env.LLM_MODEL!;
```

```bash
ollama pull qwen3:8b
LLM_PROVIDER=ollama npm run dev
```

Pull the model before the first request, since local inference needs the weights on disk. Both `/v1/chat/completions` and the stateless flavor of `/v1/responses` (added in Ollama v0.13.3) are supported, so whichever API shape your app already uses will mostly carry over.

## The context window is the setting that bites

Hosted models advertise context windows in the hundreds of thousands of tokens, and it is easy to assume a local model behaves the same. It does not by default. Ollama's [context length docs](https://docs.ollama.com/context-length) say the default is picked from your VRAM: 4k tokens under 24 GiB, 32k from 24 to 48 GiB, and 256k at 48 GiB or more. Most laptops land in the first bucket.

Four thousand tokens is gone fast once you add a long system prompt, a few tool definitions, and some retrieved documents. When a prompt overflows, you typically do not get an error; the model just answers without the parts that fell off, which looks exactly like a model that is bad at following instructions. Ollama recommends at least 64,000 tokens for agents, coding tools, and anything search-shaped.

There is a catch for OpenAI-SDK users: the OpenAI API has no field for context size, so you cannot fix this per request. You have two options. Set it for the whole server:

```bash
OLLAMA_CONTEXT_LENGTH=64000 ollama serve
```

Or bake it into a named model with a Modelfile and call that name from your app:

```bash
cat > Modelfile <<'MF'
FROM qwen3:8b
PARAMETER num_ctx 32768
MF
ollama create qwen3-32k -f Modelfile
```

Then check what you actually got. `ollama ps` shows the allocated `CONTEXT` and a `PROCESSOR` column; if that column shows a CPU split instead of `100% GPU`, the bigger window did not fit in VRAM and every response just got much slower. Size the window to the job, not to the maximum.

## Know which parts of the API are missing

Ollama implements a subset of the OpenAI API, and the gaps are specific. On `/v1/chat/completions`, its [compatibility page](https://docs.ollama.com/api/openai-compatibility) lists tools, streaming, JSON mode, vision, and `response_format` as supported, but `tool_choice`, `logit_bias`, `n`, and logprobs as not. Images must be base64 data URLs; a plain image URL is not supported. The Responses endpoint has no `previous_response_id` or `conversation`, so you resend history yourself.

None of these are dealbreakers, but each one is a bug waiting in code written against a hosted API. If your agent relies on `tool_choice: 'required'` to force a tool call, locally the model is free to answer in prose instead. Handle that case explicitly rather than discovering it in a demo.

## Validate the shape, every time

Structured outputs work locally: pass a JSON schema through `response_format`, or through `format` on Ollama's native `/api/chat`. The [Ollama docs](https://docs.ollama.com/capabilities/structured-outputs) suggest also putting the schema in the prompt and lowering temperature to 0. Two caveats. Ollama's cloud does not support structured outputs at all, so a "local or cloud" switch can quietly lose them. And small models will produce valid JSON with wrong content, so parse with the same schema you sent:

```ts
import { readFile } from "node:fs/promises";
import ollama from "ollama";
import * as z from "zod";

const Ticket = z.object({
  title: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  labels: z.array(z.string()),
});

const report = await readFile("bug-report.txt", "utf8");

const res = await ollama.chat({
  model: "qwen3:8b",
  messages: [
    { role: "user", content: `Triage this bug report as JSON: ${report}` },
  ],
  format: z.toJSONSchema(Ticket),
  options: { temperature: 0, num_ctx: 16384 },
});

const ticket = Ticket.parse(JSON.parse(res.message.content));
```

The native client also lets you set `num_ctx` per call, which is a good reason to reach for it in scripts and evals even if your app uses the OpenAI SDK.

## Where local actually earns its keep

An 8B model on a laptop is not a drop-in replacement for a frontier model, and pretending it is will burn more time than it saves. Where it shines is the inner loop: wiring up streaming UI, shaping prompts, running a few hundred eval cases without a bill, and handling data you are not allowed to send anywhere. Keep the provider behind config, set the context window on purpose, code to the subset Ollama implements, and validate every structured response. Then run your evals against both the local model and the production one, so you can see the quality gap before your users do.
