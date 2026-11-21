---
date: "2026-11-21T02:16:51.000-08:00"
tags: ["ai", "llm", "typescript", "streaming"]
draft: false
title: "Streaming LLM Responses: Tokens Arrive Faster Than You Should Render Them"
image: "/images/posts/streaming-llm-responses-tokens-arrive-faster-than-you-should-render-them.jpg"
topic: "ai"
description: "Streaming makes an LLM feel fast, until a proxy buffers it, Markdown re-parses on every token, or the stream dies after a 200. How to wire it end to end."
---

Turning on streaming is usually one flag. Set `stream: true`, and instead of waiting eight seconds for a full answer, the user sees the first words in a few hundred milliseconds. The model isn't any faster. It just feels faster, which is the point.

Then it goes to production. A reverse proxy holds the whole response and sends it at the end. The chat pane stutters, because every token re-parses the entire Markdown document and rewrites `innerHTML`. The "Stop" button hides the text but the server keeps generating, so you still pay for the tokens. And when the provider fails halfway through, the HTTP status has already gone out as 200, so your `if (!res.ok)` check never runs. Getting streaming right takes three pieces: the server relay, the client reader, and the renderer.

## The server: relay events, and own the failure path

Don't pipe the provider's raw stream straight to the browser. Wrap it in a small event protocol you control. That keeps your API key on the server, and it gives errors and completion their own events. Here's a route handler using the [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md). It uses the standard `Request`/`Response` objects, so it works in Next.js route handlers, Nitro/Nuxt, and most edge runtimes:

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages } = await req.json();
  const encoder = new TextEncoder();
  const llm = client.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages,
  });

  const body = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        } catch {
          // client already gone
        }
      };
      llm.on("text", (delta) => send("delta", { text: delta }));
      llm.on("finalMessage", (msg) =>
        send("done", { stopReason: msg.stop_reason }),
      );
      llm.on("error", () => send("error", { message: "generation_failed" }));
      llm.on("end", () => {
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      llm.abort(); // client disconnected: stop generating (and paying)
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // tells nginx not to buffer this response
    },
  });
}
```

There are three details here that people tend to learn the hard way. First, the provider can send an error _inside_ the stream: Anthropic's [streaming docs](https://platform.claude.com/docs/en/build-with-claude/streaming) give `overloaded_error` as the in-stream version of an HTTP 529. So "error" has to be an event, not a status code. Second, `cancel()` runs when the browser goes away, and `llm.abort()` closes the upstream request so generation actually stops. Third, `done` carries `stop_reason`, so the UI can tell a finished answer from one cut off at `max_tokens`.

## The client: read with fetch, batch with requestAnimationFrame

`EventSource` only does GET requests and can't send a body, so it doesn't fit a chat endpoint. Read the response with `fetch` and parse the frames yourself. It's about 20 lines. The part that matters is that a token doesn't trigger a render. Tokens pile up in a buffer, and that buffer gets flushed once per frame:

```ts
export async function streamChat(
  messages: unknown[],
  onText: (chunk: string) => void,
  signal: AbortSignal,
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let pending = "";
  let frame = 0;
  const flush = () => {
    frame = 0;
    onText(pending);
    pending = "";
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? ""; // keep the incomplete frame for the next read
    for (const raw of frames) {
      const event = raw.match(/^event: (.*)$/m)?.[1];
      const data = JSON.parse(raw.match(/^data: (.*)$/m)?.[1] ?? "{}");
      if (event === "delta") {
        pending += data.text;
        frame ||= requestAnimationFrame(flush);
      }
      if (event === "error") throw new Error(data.message);
    }
  }
  if (frame) cancelAnimationFrame(frame);
  if (pending) flush();
}
```

A network chunk doesn't always line up with an event boundary, which is why the last piece of `buffer` is held back until the next read. The `signal` comes from an `AbortController` attached to your Stop button. Aborting the fetch closes the connection, which runs the server's `cancel()`, which aborts the upstream call. One click stops the whole chain.

## Rendering: append, don't re-parse

For plain text, the [Chrome team's guidance](https://developer.chrome.com/docs/ai/render-llm-responses) is to use `element.append(chunk)` rather than `textContent +=`, because the second one throws away and rebuilds the text node on every update. Markdown is harder. The naive loop, `innerHTML = marked.parse(allTextSoFar)`, re-parses and re-renders the whole document on every flush. On a long answer with syntax-highlighted code blocks, that cost grows with every update.

It also has a security problem. Model output is untrusted input: a prompt injection can get the model to emit `<img onerror=...>`. The same guidance recommends a streaming Markdown parser such as [streaming-markdown](https://github.com/thetarnav/streaming-markdown), which appends nodes instead of replacing them. Pair it with a sanitizer like DOMPurify, run over the accumulated text, and stop rendering if it removes anything.

Two more things are easy to skip. Set `aria-busy="true"` on the response region while it streams and remove it on `done`, so screen readers don't try to announce every partial update (support varies, so test with the readers your users have). And when the stream ends on an `error` event or a `max_tokens` stop, keep the partial text visible, label it as incomplete, and offer a retry. Silently replacing it with an error banner throws away an answer the user already started reading.

Streaming is a UX feature, so test it the way users experience it. Throttle the network in DevTools, put your real proxy in front of the dev server, and turn on Paint flashing while a long answer comes in. If the whole pane flashes on every token, the renderer is the bottleneck, not the model.
