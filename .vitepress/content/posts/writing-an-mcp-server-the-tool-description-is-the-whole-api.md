---
date: "2026-11-06T02:15:14.000-08:00"
tags: ["ai", "mcp", "agents", "typescript", "writing-an-mcp-server"]
draft: false
title: "Writing an MCP Server: The Tool Description Is the Whole API"
image: "/images/posts/writing-an-mcp-server-the-tool-description-is-the-whole-api.jpg"
topic: "ai"
description: "A walkthrough of building an MCP server with the v2 TypeScript SDK, and why your schemas, descriptions, and error messages matter more than protocol plumbing."
---

Most first MCP servers look the same: someone wraps their existing REST API, exposes one tool per endpoint, ships it, and then watches the model call the wrong tool with the wrong arguments. The protocol worked fine. The design didn't.

That's the part the tutorials skip. The Model Context Protocol handles transport, discovery, and validation for you, and the official SDK hides almost all of it. What's left is the part only you can do: deciding which tools exist and describing them so a model that has never seen your codebase picks the right one. Your audience isn't a developer reading docs. It's an LLM reading a JSON Schema at runtime.

## The minimum viable server

The TypeScript SDK's v2 line is now the stable release and targets the `2026-07-28` spec revision. It's split into `@modelcontextprotocol/server` and `@modelcontextprotocol/client`, and tool schemas use Standard Schema, so Zod v4, Valibot, or ArkType all work. If you're on `@modelcontextprotocol/sdk`, that's the v1 line; it still gets fixes, and there's a migration guide plus a codemod for the move.

Here's a small server for a deploy pipeline with one read-only tool:

```ts
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { listDeploys } from "./deploys.js";

function createServer(): McpServer {
  const server = new McpServer({ name: "deploys", version: "1.0.0" });

  server.registerTool(
    "list-recent-deploys",
    {
      title: "List recent deploys",
      description:
        "List the most recent production deploys for one service, newest first. " +
        "Use this before rolling back to find the deploy ID to roll back to.",
      inputSchema: z.object({
        service: z
          .string()
          .describe(
            'Service slug as shown in the dashboard, e.g. "billing-api"',
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Defaults to 5"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ service, limit }) => {
      const deploys = await listDeploys(service, limit ?? 5);
      if (deploys.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No deploys found for "${service}". Check the service slug.`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(deploys, null, 2) }],
      };
    },
  );

  return server;
}

void serveStdio(createServer);
console.error("deploys MCP server running on stdio");
```

A few details carry most of the weight here. The `inputSchema` is the only schema you write: the SDK derives the JSON Schema the model sees, validates arguments before your handler runs, and infers your handler's types. Every `.describe()` survives into that JSON Schema, and per the SDK docs it's the only documentation the model gets for that argument. Note the `console.error` too. On stdio, stdout is the protocol channel, and a stray `console.log` corrupts the JSON-RPC stream.

You can poke at it without wiring up a host:

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

## Errors are prompts, too

When a model sends arguments that fail the schema, the SDK returns an ordinary tool result with `isError: true` and a message like `limit: Too big: expected number to be <=20`. The model reads it and retries. That's the pattern to copy in your own handlers: return a failed result with a sentence that tells the model what to do next, rather than a stack trace.

"No deploys found. Check the service slug." is a useful error. `TypeError: Cannot read properties of undefined` is not. The model will act on whatever you return, so write errors the way you'd write a hint for a new teammate.

For results another program will consume, add an `outputSchema` and return `structuredContent` alongside the human-readable `content`. The SDK validates the structured value against the schema before it leaves your server, and advertises the schema in `tools/list` so clients can validate it as well.

## Destructive tools need honest annotations

Now the tool that actually matters:

```ts
server.registerTool(
  "rollback-deploy",
  {
    title: "Roll back a deploy",
    description:
      "Roll a service back to a previous deploy. This changes production. " +
      "Only call this after the user has confirmed the exact deploy ID.",
    inputSchema: z.object({
      service: z.string(),
      deployId: z
        .string()
        .describe('ID from list-recent-deploys, e.g. "dpl_8f2c"'),
    }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
  },
  async ({ service, deployId }) => {
    const result = await rollback(service, deployId);
    return {
      content: [
        { type: "text", text: `Rolled ${service} back to ${result.deployId}.` },
      ],
    };
  },
);
```

Annotations are hints. They don't change how the SDK runs the tool; hosts use them to decide what to put in front of the user, like auto-approving a read-only tool and asking for confirmation before a destructive one. That means they're only as trustworthy as you make them, and a host can ignore them. Real authorization still belongs inside `rollback()`, not in a description string.

## The 2026-07-28 spec made servers stateless

If you read an MCP tutorial from last year, one thing has changed underneath you. The current spec removed protocol-level sessions and the `Mcp-Session-Id` header from the Streamable HTTP transport, and dropped the `initialize` handshake; each request now carries its own protocol version and client capabilities. Servers that need state across calls are expected to mint explicit handles and pass them as ordinary tool arguments.

For tool design, that's good news. A `deployId` returned by one tool and passed to the next is exactly that kind of handle, and it's visible to the model instead of hidden in a session. The spec also now says servers SHOULD return `tools/list` in a deterministic order, which helps client-side caching and LLM prompt cache hit rates. Don't build your tool list from an unordered map.

## When not to write one

If only your own app calls the model, you probably don't need MCP. Plain function calling against your provider's API is less code and one fewer process. MCP earns its keep when you want the same tools available in several hosts, like your editor, a desktop assistant, and a coding agent, without rewriting the integration for each.

When you do build one, start with two or three tools that map to tasks, not endpoints, and spend your time on descriptions and error messages. The SDK's [Tools guide](https://ts.sdk.modelcontextprotocol.io/v2/) and the [2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) are the two pages worth reading before you write a line.
