---
created_at: '2026-04-19T08:48:00.000-08:00'
tags: ['javascript', 'performance', 'web-apis', 'tooling']
draft: true
title: "Edge Functions: Running Code Where Your Users Are"
image: '/images/posts/edge-functions-cloudflare-workers-and-the-edge-runtime.jpg'
topic: 'development'
description: "Edge functions run your code in data centers close to users, eliminating the latency of a centralized origin server. Here's what they're good for and how to build with them."
---

Traditional serverless functions run in a single region. A user in Tokyo hitting an API deployed in us-east-1 waits for a round trip across the Pacific before getting a response. Edge functions solve this by running your code at hundreds of points of presence worldwide — the compute moves to wherever your users are.

## What Makes Edge Different

Edge runtimes like Cloudflare Workers use V8 isolates instead of Node.js processes or containers. This gives them near-instant cold start times (under 1ms vs. hundreds of milliseconds for traditional serverless) because there's no process to spin up. The tradeoff: you're running in a constrained environment with a Web-standard API subset, not full Node.js.

```js
// Cloudflare Worker — runs at the edge, globally
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route requests without a round-trip to origin
    if (url.pathname === '/api/geo') {
      return Response.json({
        country: request.cf.country,
        city: request.cf.city,
        timezone: request.cf.timezone,
      });
    }

    // Pass everything else to origin
    return fetch(request);
  },
};
```

The `request.cf` object on Cloudflare Workers gives you geolocation data for free — no external API call required.

## Practical Use Cases for Edge Functions

Edge functions aren't universally better than traditional serverless — they excel at specific tasks:

```ts
// 1. A/B testing at the edge — no origin round-trip
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const variant = Math.random() < 0.5 ? 'a' : 'b';

    // Rewrite the URL to serve different content
    url.pathname = `/experiments/button-${variant}${url.pathname}`;
    const response = await fetch(url.toString());

    // Clone and add a header so analytics can track it
    const modified = new Response(response.body, response);
    modified.headers.set('X-Experiment-Variant', variant);
    return modified;
  },
};
```

```ts
// 2. Authentication at the edge — validate JWT before hitting origin
import { jwtVerify } from 'jose';

export default {
  async fetch(request: Request, env: Env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401 });

    try {
      await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));
    } catch {
      return new Response('Invalid token', { status: 401 });
    }

    return fetch(request); // Forward authenticated request to origin
  },
};
```

```ts
// 3. Edge caching with KV — serve personalized content globally
export default {
  async fetch(request: Request, env: Env) {
    const userId = getUserId(request);
    const cacheKey = `preferences:${userId}`;

    let prefs = await env.KV.get(cacheKey, { type: 'json' });
    if (!prefs) {
      const res = await fetch(`${env.ORIGIN}/api/preferences/${userId}`);
      prefs = await res.json();
      await env.KV.put(cacheKey, JSON.stringify(prefs), { expirationTtl: 300 });
    }

    return Response.json(prefs);
  },
};
```

## Wrangler for Local Development

Cloudflare's `wrangler` CLI gives you a local dev environment that closely mirrors the production edge:

```bash
npm install -D wrangler

# Develop locally with hot reload
wrangler dev

# Deploy to the Cloudflare edge globally
wrangler deploy
```

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-09-23"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

[vars]
ORIGIN = "https://api.yourdomain.com"
```

## Edge vs. Serverless: When to Use Each

Use edge functions for: request routing, auth middleware, geolocation-based logic, response header manipulation, and lightweight API endpoints that don't need a database.

Use traditional serverless for: database-intensive operations (most databases aren't edge-distributed), long-running processes, and anything that requires the full Node.js ecosystem.

The best architectures often combine both: edge functions handle the fast path (auth, routing, caching), and origin serverless handles the heavy lifting.
