---
date: '2026-11-15T02:15:25.000-08:00'
tags: ['nuxt.js', 'vue', 'typescript', 'node']
draft: false
title: "nuxt/server: Write Server Routes Today That Still Run on Nuxt 5"
image: '/images/posts/nuxt-server-write-server-routes-today-that-still-run-on-nuxt-5.jpg'
topic: 'development'
description: "Nuxt 4.6 adds nuxt/server, a portable import surface for API routes. Here's how to move handlers off h3 now so the Nitro v3 upgrade is a non-event."
---

Every Nuxt app with a `server/` directory has a quiet dependency problem. Your API routes call `defineEventHandler`, `getQuery`, and `readBody`, and those come from h3. Your modules import types from `nitropack`. That has been fine for years, but Nuxt 5 moves to Nitro v3 and h3 v2, and both ship breaking changes. Every handler you wrote against h3 v1 is a handler you will touch during that upgrade, and every module you depend on has to cut a release before you can move.

Nuxt 4.6 is the escape hatch. It ships `nuxt/server`, a new import source owned by Nuxt itself, and server code written against it runs unchanged on Nuxt 4 today and Nuxt 5 later. Nothing forces you to migrate. But if you have a weekend and a handful of API routes, this is the cheapest that upgrade will ever be.

## What nuxt/server actually is

Think of it as the server-side twin of `nuxt/app`. Handlers, middleware, and the utilities most apps reach for all come from one place, and they are typed against a portable `RequestEvent` built on web standards rather than h3's event object:

```ts
event.req // a standard Request
event.url // a standard URL
event.res // { status, statusText, headers }
event.res.headers // a standard Headers object
event.context // per-request context
```

Under the default `@nuxt/nitro-server` builder this is still Nitro and h3 doing the work. The difference is that your file never imports either one. The Nuxt team is explicit that Nitro remains the right choice for almost everyone; the point of `nuxt/server` is that your code stops caring which major version of Nitro is underneath it.

A minimal handler looks almost identical to what you write now:

```ts
// server/api/hello.ts
import { defineEventHandler, getQuery } from 'nuxt/server'

export default defineEventHandler((event) => {
  const { name } = getQuery<{ name?: string }>(event)
  return { message: `Hello, ${name ?? 'world'}!` }
})
```

The surface is deliberately small: event handlers, `createError`, headers, query, body, cookies, redirects, response status, router params, `getRequestIP`, `handleCors`, route rules, runtime and app config, and sessions. If something is missing, the official advice is to reach for the web API directly (`event.req.headers.get('x-foo')`) or open an issue.

## The one gotcha: explicit imports

This is the part that will bite you. On Nuxt 4, the **auto-imported** `defineEventHandler`, `getQuery`, and `readBody` are still h3's versions, which expect h3's event shape. If you import `getQuery` from `nuxt/server` but let `defineEventHandler` come from auto-imports, you have mixed the two runtimes in one file. Nuxt catches this and throws a `NUXT_E8012` error that names the import to fix.

The rule is simple: when you migrate a file, import **everything** from `nuxt/server`, including `defineEventHandler`.

A few helpers also behave differently from their h3 v1 namesakes, and these are worth a grep across your `server/` directory:

```ts
// h3 v1: sends the response as a side effect
sendRedirect(event, '/login')

// nuxt/server: returns the response, so you must return it
return sendRedirect(event, '/login')

// h3 v1
throw createError({ statusCode: 404, statusMessage: 'Not found' })

// nuxt/server
throw createError({ status: 404, statusText: 'Not found' })
```

Response headers move to `event.res.headers`, a plain `Headers` instance, instead of h3's header helpers. The upgrade guide has a full table of differences under "Moving to `nuxt/server`".

You also do not have to go all-in. A handler that needs something outside the new surface, like multipart parsing, can keep importing from `h3` exactly as it did on 4.5. Migrate file by file.

## Validation and sessions come along for the ride

Two features in 4.6 make the move more than a rename. First, `readValidatedBody` accepts any Standard Schema library, so Zod, Valibot, and ArkType all work without an adapter:

```ts
// server/api/users.post.ts
import { defineEventHandler, readValidatedBody } from 'nuxt/server'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const user = await readValidatedBody(event, z.object({ name: z.string() }))
  return { created: user.name }
})
```

If you turn on `experimental.routeTypedFetch`, that schema flows through to your client: `$fetch('/api/users', { method: 'post' })` with a missing or wrongly shaped body becomes a type error at the call site. The rebuilt typed fetch also fixes the infamous `TS2589` "excessively deep" error on apps with hundreds of routes.

Second, there are built-in sessions. Nuxt now has a root `runtimeConfig.appSecret` (set via `NUXT_APP_SECRET`, generated with `openssl rand -base64 32`), and sessions are sealed into a cookie with iron, so there is no Redis or database to provision:

```ts
// server/api/visits.ts
import { defineEventHandler, useSession } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const session = await useSession<{ visits: number }>(event)
  await session.update((data) => ({ visits: (data.visits ?? 0) + 1 }))
  return { visits: session.data.visits }
})
```

The tradeoff with cookie-sealed sessions is the usual one: the data rides along on every request and has to stay small, and you cannot revoke a single session server-side without adding your own denylist. For a visit counter, a cart ID, or a user ID pointing at your real auth store, that is perfectly fine. For anything large or security-critical, keep the session as a pointer, not the payload. Also note that in development Nuxt generates a secret for you, but builds never do, so set `NUXT_APP_SECRET` in production before you deploy.

## Where to start

Run `npx nuxt upgrade --dedupe` to get onto 4.6 (it needs Node.js 22.22.3+, 24.15+, or 26+), then pick your simplest API route and switch every import in it to `nuxt/server`. Fix any `sendRedirect` calls that need a `return` and any `createError` calls still using `statusCode`. Once that file passes, the rest follow the same pattern. If you want to see what else Nuxt 5 will change, set `future.compatibilityVersion: 5` in a branch and let the test suite tell you. The [Nuxt 4.6 release post](https://nuxt.com/blog/v4-6) and the [upgrade guide](https://nuxt.com/docs/4.x/getting-started/upgrade) cover the full list.
