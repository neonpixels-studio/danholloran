---
created_at: "2025-11-18T16:12:00.000-08:00"
tags: ["javascript", "react", "tooling"]
draft: false
title: "Next.js 15 App Router: Patterns Worth Adopting Now"
image: "/images/posts/nextjs-15-app-router-patterns.jpg"
topic: "development"
description: "Next.js 15 shipped with a stabilized App Router and a cleaner async model. Here are the patterns that actually improve your day-to-day development."
---

The App Router has been part of Next.js for a couple of years now, but Next.js 15 marks the point where it feels genuinely production-ready rather than a carefully guarded beta experiment. The team addressed the rough edges — async request APIs, caching surprises, and turbopacked builds — and the result is a framework that rewards the patterns you should already be writing.

## Async Request APIs Are Now the Default

The biggest mental shift in Next.js 15 is that `cookies()`, `headers()`, `searchParams`, and `params` are now async. This sounds like friction, but it's actually an alignment with how these values work: they're inherently per-request, and making them synchronous required implicit magic behind the scenes.

```tsx
// Next.js 14 — synchronous (deprecated)
import { cookies } from "next/headers";

export default function Page() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  // ...
}

// Next.js 15 — properly async
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  // ...
}
```

The practical upside is that Next.js can now statically analyze which routes actually need request-time data and which can be prerendered. Routes that don't await any request APIs are automatically treated as static, which means better performance with no extra configuration from you.

## Smarter Caching Defaults

Next.js 15 changed `fetch` caching from opt-out to opt-in. Previously, every `fetch` inside a Server Component was cached by default unless you passed `{ cache: 'no-store' }`. This tripped up a lot of developers who were puzzled why their data wasn't updating.

Now the default is uncached — `fetch` behaves like it does in every other JavaScript context — and you explicitly opt into caching when you want it:

```tsx
// Cache this data for 60 seconds
const data = await fetch("https://api.example.com/products", {
  next: { revalidate: 60 },
});

// Cache indefinitely until manually revalidated
const config = await fetch("https://api.example.com/config", {
  next: { tags: ["config"] },
});

// Default: no cache (fresh on every request)
const user = await fetch("https://api.example.com/me");
```

This model is far more predictable. The rule is simple: if you want caching, you ask for it. If you're not sure, the default is safe.

## Turbopack in Dev by Default

Running `next dev` now uses Turbopack by default. In large applications, this translates to significantly faster cold starts and HMR updates. The webpack-based dev server is still available via `next dev --turbopack=false`, but for most projects you won't need the escape hatch.

```bash
# Uses Turbopack automatically
next dev

# Explicit opt-out if you hit a compatibility issue
next dev --turbopack=false
```

If you have custom webpack plugins, check the Turbopack compatibility list first. Most common loaders are supported, but niche webpack plugins may not be. The Turbopack docs include a codemods page to help migrate custom configurations.

## Composing Server and Client Components

The pattern that unlocks the most from the App Router is keeping Server Components as far down the tree as possible, passing only serializable data to Client Components:

```tsx
// server-only: fetch data close to where it's used
async function ProductCard({ id }: { id: string }) {
  const product = await db.products.findById(id);
  return <ProductCardClient product={product} />;
}

// 'use client': only the interactive shell
("use client");
function ProductCardClient({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  return (
    <div>
      <h2>{product.name}</h2>
      <QuantityPicker value={qty} onChange={setQty} />
      <AddToCart productId={product.id} qty={qty} />
    </div>
  );
}
```

This pattern keeps your bundle small (the data-fetching code never ships to the browser) while still giving you full client interactivity where you need it. Next.js 15's improved tree-shaking makes these boundaries more effective than they were in earlier releases.

The App Router isn't just a new file convention — it's a different mental model for how rendering and data fetching relate. Next.js 15 makes that model click.
