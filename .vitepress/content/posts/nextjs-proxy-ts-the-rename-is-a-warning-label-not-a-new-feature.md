---
date: "2026-11-16T02:14:34.000-08:00"
tags: ["next.js", "react", "typescript", "node"]
draft: false
title: "Next.js proxy.ts: The Rename Is a Warning Label, Not a New Feature"
image: "/images/posts/nextjs-proxy-ts-the-rename-is-a-warning-label-not-a-new-feature.jpg"
topic: "development"
description: "Next.js 16 renamed middleware.ts to proxy.ts and moved it to Node.js. The codemod is one line; the real change is what you should stop putting in that file."
---

If you upgraded to Next.js 16, you probably ran the codemod, watched `middleware.ts` become `proxy.ts`, saw `export function middleware` turn into `export function proxy`, and moved on. Fair enough. The build passed, the redirects still redirect, and the deprecation warning went away.

But the rename was not cosmetic. The Next.js docs say it plainly: the old name invited people to treat the file like Express middleware, and the team now recommends using it "as a last resort." The word "proxy" is a warning label. It describes a network boundary that sits in front of your app, not a place to run your app's logic. Two other changes ride along with it, and both affect what you should keep in that file.

## What actually changed

The mechanical part is small. Run the codemod from the project root:

```bash
npx @next/codemod@canary middleware-to-proxy .
```

It renames the file, renames the exported function, and swaps the `skipMiddlewareUrlNormalize` config flag for `skipProxyUrlNormalize`. The old `middleware.ts` still works in 16 but is deprecated and slated for removal.

The runtime change matters more. Middleware ran on the Edge runtime by default for years. Node.js support arrived experimentally in 15.2 and went stable in 15.5. In 16, Proxy **defaults to Node.js**, and you can no longer choose: setting `export const runtime` in a proxy file throws an error.

```ts
// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// export const runtime = 'edge' // throws in Next.js 16

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/old-pricing") {
    return NextResponse.redirect(new URL("/pricing", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

On Node you get the full standard library and any npm package, not the Edge subset. That sounds like permission to do more. It is the opposite. The file is easier to misuse now, because the friction that used to stop you from opening a database connection in it is gone.

## The trap: Proxy as your auth layer

The most common misuse is the session check that guards the whole app:

```ts
// proxy.ts: the pattern to move away from
export async function proxy(request: NextRequest) {
  const session = await db.session.findUnique({
    where: { token: request.cookies.get("session")?.value },
  });
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```

This has three problems. First, it runs on every matched request, including prefetches, so a database round trip gets added in front of navigations that should be instant. Second, the docs warn against relying on shared modules or globals in Proxy, because it can be deployed separately from your render code. Your connection pool may not live where you think it does.

Third, and most important, it is a single point of failure for authorization. The Proxy docs call out a subtle case. Server Functions are not separate routes. They are POST requests to whatever page uses them. If a matcher change or a refactor moves a Server Function to a path the matcher excludes, Proxy coverage silently disappears, and nothing in the build tells you. This is not hypothetical: in March 2025, CVE-2025-29927 showed that a crafted `x-middleware-subrequest` header could skip middleware entirely on vulnerable versions. Any app whose only auth check lived in middleware was wide open.

The fix is the one the Next.js data security guide recommends: verify the session where the data is read or written.

```ts
// app/lib/dal.ts
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFromDb } from "./sessions";

export const verifySession = cache(async () => {
  const token = (await cookies()).get("session")?.value;
  const session = token ? await getSessionFromDb(token) : null;
  if (!session) redirect("/login");
  return session;
});
```

```ts
// app/actions.ts
"use server";
import { verifySession } from "./lib/dal";
import { db } from "./lib/db";

export async function deleteProject(id: string) {
  const session = await verifySession();
  await db.project.delete({ where: { id, ownerId: session.userId } });
}
```

`cache` deduplicates the lookup within a single render, so calling it in several components costs one query. Now every action and page protects itself, regardless of what the matcher says.

## What still belongs in proxy.ts

Proxy is still the right tool for decisions you can make from the request alone, before any rendering happens:

- Redirects and rewrites based on path, locale, or a feature-flag cookie
- An optimistic auth check: does a session cookie _exist_? If not, send the user to `/login` early. This is a UX shortcut, not a security boundary.
- Setting request or response headers, such as CORS, a request ID, or a security header
- Fire-and-forget logging with `event.waitUntil()`, so analytics never delays the response

A quick test: if the logic needs to query a database or validate a token cryptographically, it belongs in your data layer. If it only reads the URL, headers, or cookies and returns a redirect, rewrite, or header, it belongs in Proxy.

Two smaller details are worth knowing. Without a `matcher`, Proxy runs on everything, including `_next/static` and files in `public/`, so a redirect bug can block your CSS. And even if you exclude `_next/data` in a negative matcher, Proxy still runs for those routes. That is deliberate, so you can't protect a page while forgetting its data route.

## The takeaway

Run the codemod, then open the renamed file and read it as if the new name were a code review comment. Anything that touches a database or acts as your only authorization check should move into a `server-only` data access layer that each page and Server Function calls. What is left should be short: redirects, rewrites, headers, and maybe a cookie-presence check. The [proxy.js API reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) covers the matcher syntax and the experimental testing helpers if you want to lock that behavior down with unit tests.
