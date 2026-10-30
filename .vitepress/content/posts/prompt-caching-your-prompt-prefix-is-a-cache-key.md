---
date: "2026-10-30T02:15:11.000-07:00"
tags: ["ai", "llm", "typescript", "node", "prompt-caching"]
draft: false
title: "Prompt Caching: Your Prompt's Prefix Is a Cache Key"
image: "/images/posts/prompt-caching-your-prompt-prefix-is-a-cache-key.jpg"
topic: "ai"
description: "Prompt caching can cut repeated input costs by around 80%, but only if your prompt is ordered so the stable parts come first. Here's how it works and the mistakes that quietly break it."
---

Look at the input token count on a typical LLM feature and most of it is the same on every request. The system prompt, the tool definitions, the twelve few-shot examples, the product docs you stuffed in for grounding: thousands of tokens, identical every time, paid for every time. The user's actual question is a rounding error at the end.

Prompt caching exists for exactly this. The provider saves the model's processed state for the start of your prompt, and the next request that begins with the same tokens skips that work. It's cheaper and faster. The catch is that it matches on an exact prefix, which means the order you assemble your prompt in suddenly matters a lot more than it used to.

## How the prefix match works

The cache key is the prompt itself, read from the beginning. If request two starts with the exact same tokens as request one, up to a cache point, it can reuse request one's work. Change one token near the top, a timestamp, a user's name, a reshuffled tool list, and everything after that token is a miss.

Both major APIs follow this model, with different defaults. On Anthropic's Messages API you opt in with `cache_control`. You can either drop a single top-level `cache_control` and let the API place the breakpoint on the last cacheable block (it moves forward as a conversation grows), or put `cache_control` on specific blocks yourself, up to four breakpoints. Prefixes are built in a fixed order: tools, then system, then messages. Changing a tool definition invalidates the whole cache; changing a message only invalidates the messages level.

OpenAI caches automatically once a prefix crosses the minimum length (1,024 tokens on GPT-5.6 and later), and lets you pass a `prompt_cache_key` to improve routing so similar requests land where the cache lives. Newer models also support explicit breakpoints.

The pricing shape is similar on both. Writing to the cache costs a bit more than normal input (1.25x for Anthropic's default 5-minute TTL, 2x for the 1-hour option), and reading from it costs a fraction: 0.1x base input on most models, lower on some newer ones. Check your model's pricing page before you build a budget around it.

## Ordering your prompt for hits

Here's a support assistant using Anthropic's TypeScript SDK. The stable content goes first and carries the breakpoint; anything that changes per request goes after it.

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function answer(
  question: string,
  user: { name: string; plan: string },
) {
  const response = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 1024,
    tools: SUPPORT_TOOLS, // stable, same order every request
    system: [
      {
        type: "text",
        text: SUPPORT_INSTRUCTIONS + PRODUCT_DOCS, // thousands of static tokens
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        // per-request context lives AFTER the breakpoint
        content: `Customer: ${user.name} (${user.plan} plan)\n\n${question}`,
      },
    ],
  });

  const { cache_creation_input_tokens, cache_read_input_tokens, input_tokens } =
    response.usage;
  console.log({
    cache_creation_input_tokens,
    cache_read_input_tokens,
    input_tokens,
  });
  return response;
}
```

The tempting version puts `Customer: ${user.name}` at the top of the system prompt because it "reads better." That one line makes every customer's prefix unique, and the cache never hits across users.

Do the math on why ordering is worth caring about. Say the static block is 6,000 tokens and you get 10 requests inside the TTL window. Without caching you pay for 60,000 input tokens. With caching you pay one write at 1.25x (7,500 token-equivalents) plus nine reads at 0.1x (5,400), so 12,900 total. That's roughly 21% of the uncached cost for the static portion, and the time to first token drops too, because the model isn't reprocessing those tokens.

## The quiet ways it breaks

Caching fails silently. A prompt that misses the cache still works; it just costs full price. So the most important habit is logging the usage fields. On Anthropic, if both `cache_creation_input_tokens` and `cache_read_input_tokens` are 0, nothing was cached. On OpenAI, look at `cached_tokens` under `usage.input_tokens_details` (Responses API) or `usage.prompt_tokens_details` (Chat Completions).

The usual culprits:

- **Too short.** Each model has a minimum cacheable length. Below it, `cache_control` is ignored with no error. On Anthropic it ranges from 512 tokens on the newest models up to 4,096 on some older ones.
- **Non-deterministic serialization.** Building tool schemas from an object whose key order changes, or sorting docs by "last updated," produces a different prefix each time.
- **Dynamic values up top.** "Today is October 30th" in the first line of the system prompt invalidates the cache every day at minimum. Move it below the breakpoint.
- **Changing knobs.** On Anthropic, toggling things like `tool_choice`, images, or thinking settings invalidates part of the cache. Pick them per feature, not per request, where you can.
- **Low traffic.** A 5-minute TTL does nothing for a feature that gets one request an hour. Either use a longer TTL (and pay the higher write rate) or accept that caching isn't buying you anything there.

That last one is worth taking seriously. If your requests are sparse and your prompts are short, caching adds a write surcharge and complexity for no gain. It pays off for chat, agents with long tool lists, RAG over a stable corpus, and batch jobs that hit the same instructions thousands of times.

Start by logging cache fields on every call for a day. If the read numbers are near zero, the fix is almost always ordering: stable things first, changing things last, and nothing clever in between. Anthropic's [prompt caching docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) and OpenAI's [prompt caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) both have per-model minimums and pricing tables worth bookmarking.
