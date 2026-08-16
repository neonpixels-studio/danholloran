---
date: "2026-08-16T02:07:44.000-05:00"
tags: ["javascript", "react", "performance", "web-apis", "jamstack"]
draft: false
title: "revalidateTag vs updateTag: Next.js Split Cache Invalidation in Two"
image: "/images/posts/revalidatetag-vs-updatetag-nextjs-split-cache-invalidation-in-two.jpg"
topic: "development"
description: "Next.js 16 gave cache invalidation two different functions instead of one, and the split maps to a real distinction: content that can lag versus content the user just typed."
---

There is a bug I have written at least three times. An editor updates a product description in the CMS, hits publish, refreshes the page, and sees the old copy. So I add an on-demand revalidation webhook. Then a logged-in user submits a form, gets redirected to the detail page, and sees their own submission missing. Same cache, same invalidation call, two completely different expectations about what "invalidate" means.

Next.js 16 stopped pretending those are the same operation. `revalidateTag` and `updateTag` now exist side by side, and the difference is not a naming quirk. One serves stale content while it rebuilds. The other blocks until the data is fresh. Picking the wrong one is how you end up with the bug above.

## The staleness question decides which function you call

Both functions operate on cache tags, so the setup is identical. You tag cached data either through `fetch` or inside a `'use cache'` function:

```ts
import { cacheTag, cacheLife } from "next/cache";

export async function getProduct(id: string) {
  "use cache";
  cacheTag("products", `product-${id}`);
  cacheLife("max");

  const res = await fetch(`https://cms.example.com/products/${id}`);
  return res.json();
}
```

`cacheLife('max')` says: do not bother with time-based expiry, this thing stays cached until something explicitly tells us it changed. That is the right posture for CMS content. Nobody wants a revalidate-every-60-seconds timer hammering an API that changes twice a week.

Now the invalidation. From a webhook, you want `revalidateTag`:

```ts
// app/api/cms-webhook/route.ts
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.CMS_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { model, id } = await request.json();
  revalidateTag(model === "product" ? `product-${id}` : model, "max");

  return Response.json({ revalidated: true, now: Date.now() });
}
```

That second argument matters. `revalidateTag(tag, 'max')` marks the entry stale rather than expiring it, so the next visitor gets the cached page instantly while a fresh render happens in the background. The single-argument form still works but is deprecated, and it is the blocking version, which means the unlucky first visitor after every content edit eats a full server render.

There is a subtlety worth knowing: marking a tag stale does not trigger a rebuild. Nothing regenerates until somebody actually visits a page using that tag. If you invalidate a tag attached to ten thousand product pages, you do not get ten thousand simultaneous renders. You get renders spread across real traffic, which is usually what you want and occasionally surprising if you were expecting a burst of activity in your logs.

## updateTag is for read-your-own-writes

`updateTag` only works inside Server Actions. Not Route Handlers, not Client Components. That restriction is the whole point: Server Actions are where a user does something and then immediately looks at the result.

```ts
"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function createReview(formData: FormData) {
  const review = await db.review.create({
    data: {
      productId: String(formData.get("productId")),
      body: String(formData.get("body")),
    },
  });

  updateTag("reviews");
  updateTag(`product-${review.productId}`);

  redirect(`/products/${review.productId}`);
}
```

`updateTag` expires the entry outright. The redirect that follows will wait for a fresh render rather than handing back the version of the page that does not have the review on it. Slower, and correct. Swap in `revalidateTag(tag, 'max')` here and the user lands on a page missing the thing they just wrote, which reads as a broken form even though the write succeeded.

The rule I have settled on: if a human is waiting to see their own change, `updateTag`. If a system somewhere told you data changed, `revalidateTag` with `'max'`.

## Multi-instance is where this quietly breaks

One detail the docs are refreshingly blunt about: revalidation events are local by default. Call `revalidateTag` on the instance that received the webhook and only that instance's cache is invalidated. Every other instance behind your load balancer keeps serving the old page until its own copy expires.

On a single-instance deploy or a platform that handles this for you, it never comes up. Run three containers yourself and you get a genuinely confusing bug where refreshing the page flips between old and new content depending on routing. The fix is a custom cache handler implementing `updateTags()` to write invalidation timestamps to shared storage and `refreshTags()` to read them back before each request. Wrap `refreshTags()` in a try/catch, because a thrown error there propagates as a request failure rather than degrading to stale content.

Worth auditing your own setup before you need it. Cache invalidation being hard is a cliché, but the specific hard part here is that the failure mode is invisible in development and intermittent in production.

If you are still on the single-argument `revalidateTag`, that migration is the cheapest win available: add `'max'` where a webhook fires it, switch to `updateTag` where a Server Action does.
