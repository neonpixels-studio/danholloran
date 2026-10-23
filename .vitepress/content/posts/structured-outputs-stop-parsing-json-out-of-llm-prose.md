---
date: "2026-10-23T02:15:14.000-07:00"
tags: ["ai", "llm", "typescript", "node", "structured-outputs"]
draft: false
title: "Structured Outputs: Stop Parsing JSON Out of LLM Prose"
image: "/images/posts/structured-outputs-stop-parsing-json-out-of-llm-prose.jpg"
topic: "ai"
description: "Constrained decoding means the model can't return malformed JSON. Here's how structured outputs work with Zod in TypeScript, and the edge cases they still don't cover."
---

Every team that ships an LLM feature eventually writes the same function. It takes the model's reply, strips the stray markdown fence, hunts for the first `{`, calls `JSON.parse` inside a `try`, and on failure asks the model again with a sterner prompt. It works most of the time. "Most of the time" is a terrible property for code that sits between a model and your database.

Structured outputs replace that whole function. Instead of asking nicely for JSON, you hand the API a JSON Schema and the model is physically unable to emit tokens that break it. That changes what you need to defend against, but it doesn't remove the need for defense entirely, and the gap between the two is where the bugs live.

## Prompting for JSON vs. constraining it

When you prompt for JSON, you are asking the model to follow an instruction. It usually does. Sometimes it adds a friendly sentence first, forgets a required field, or returns `"price": "12.99"` as a string when you wanted a number.

Structured outputs work differently. The provider compiles your schema into a grammar and uses it during sampling, so at every step the only tokens allowed are ones that keep the output valid against the schema. Anthropic's docs call this constrained decoding; OpenAI ships the same idea under the same "Structured Outputs" name. The result is that a well-formed response will always parse and always have the fields you marked as required.

There are costs. The first request with a new schema is slower while the grammar compiles (Anthropic caches compiled grammars for 24 hours from last use). The API also injects a short system prompt describing the format, so you pay a few extra input tokens. And changing the schema invalidates any prompt cache for that conversation.

## A typed extraction call with Zod

The Anthropic TypeScript SDK has a Zod helper that converts your schema, sends it, and validates the reply. Here is a support-ticket triage function:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const client = new Anthropic();

const Triage = z.object({
  category: z.enum(["billing", "bug", "feature_request", "account"]),
  priority: z.enum(["low", "normal", "urgent"]),
  summary: z.string(),
  affected_order_ids: z.array(z.string()),
});

export async function triageTicket(body: string) {
  const message = await client.messages.parse({
    model: "claude-sonnet-5-5",
    max_tokens: 1024,
    messages: [
      { role: "user", content: `Triage this support ticket:\n\n${body}` },
    ],
    output_config: { format: zodOutputFormat(Triage) },
  });

  if (message.stop_reason !== "end_turn") {
    throw new Error(`Triage did not complete: ${message.stop_reason}`);
  }

  return message.parsed_output; // typed as z.infer<typeof Triage>
}
```

No regex, no retry loop, and `parsed_output` is fully typed. If you already have a JSON Schema from an OpenAPI spec, the raw request shape is `output_config: { format: { type: 'json_schema', schema } }` and the JSON arrives in the response's text block. The older `output_format` parameter is deprecated in favor of `output_config.format`.

## What the guarantee does not cover

Notice the `stop_reason` check above. That is not paranoia; it is the documented boundary of the guarantee.

**Truncation.** If the model hits `max_tokens` mid-object, you get `stop_reason: "max_tokens"` and incomplete JSON. Size `max_tokens` for your largest realistic output, especially with arrays.

**Refusals.** If the model declines a request for safety reasons, the response has `stop_reason: "refusal"`, a 200 status, and output that may not match your schema. You are still billed for it.

**Unsupported constraints.** The grammar can't express everything. Numeric bounds like `minimum`, string `minLength`/`maxLength`, and recursive schemas are not supported on the API side. The SDK helpers quietly handle this: they strip the constraint, append it to the field's description as a hint, and then validate the reply against your original schema locally. So `z.number().min(1)` still works, but it is enforced by your code, not the grammar. A response can be valid JSON and still fail Zod. Catch that error.

**Enum casing.** Anthropic's docs note that enum and `const` values can come back with different capitalization, like `"Topic 3"` instead of `"topic 3"`. Keep enum values lowercase and snake_cased, and never define two values that differ only by case.

**Property order.** Required properties are emitted first, then optional ones. If anything downstream cares about key order (a streaming UI, a diff), mark everything required.

## Keep schemas boring

Complex schemas compile into large grammars, and the API enforces limits. On Anthropic, all strict schemas in one request share a budget of 24 optional parameters and 16 union-typed parameters (`anyOf`, or `"type": ["string", "null"]`), and an oversized grammar returns a 400 with "Schema is too complex for compilation."

The fix is also good design: make fields required and let the model supply an explicit default, flatten nesting, and split one giant extraction into two smaller calls. If you have a field like `reasoning` that asks for step-by-step thinking, swap it for a short `explanation`; long reasoning fields can trigger refusals, and extended thinking is the better place for that work.

One more tradeoff: structured outputs are incompatible with citations and with assistant-message prefilling. If you need sourced answers, you'll have to choose.

## Takeaway

Use structured outputs for anything a machine reads next: extraction, classification, routing, form filling. Then write the small amount of code the guarantee doesn't cover: check `stop_reason`, catch validation errors for constraints the grammar can't enforce, and compare enums case-insensitively. That handful of lines is far easier to reason about than the parse-and-pray function it replaces. The [Anthropic structured outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) list the full set of supported JSON Schema features.
