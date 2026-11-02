---
date: "2026-11-02T02:15:15.000-08:00"
tags: ["graphql", "performance", "javascript", "react"]
draft: false
title: "GraphQL @defer: Stop Letting Your Slowest Field Set Your Load Time"
image: "/images/posts/graphql-defer-stop-letting-your-slowest-field-set-your-load-time.jpg"
topic: "development"
description: "One slow resolver can hold an entire GraphQL response hostage. Here's how @defer and @stream split a query into an initial payload and later patches, and what to check before you ship it."
---

The pitch for GraphQL is that a page asks for everything it needs in one request. The catch nobody puts on the slide: that one request is only as fast as its slowest field. Your product page has `name`, `price`, and `image` ready in 20ms, but `reviews` calls a service that takes 900ms, so the whole response waits 900ms. The user stares at a spinner for data you already had.

The usual workaround is to split the query in two and fire the slow one separately. That works, but it throws away the thing you liked about GraphQL in the first place: one operation that describes one screen. `@defer` and `@stream` are the spec-track fix. They let a single query return an initial payload right away and send the slow parts later as patches.

## How @defer works

`@defer` goes on a fragment spread or an inline fragment. Everything outside the deferred fragment comes back in the first payload. The fragment's fields arrive in a later payload once they resolve.

```graphql
query ProductPage($id: ID!) {
  product(id: $id) {
    id
    name
    price
    ...Reviews @defer(label: "reviews")
  }
}

fragment Reviews on Product {
  reviews(first: 10) {
    body
    rating
  }
}
```

The client gets `id`, `name`, and `price` immediately and can render the page. A second payload carries `reviews`, and the client merges it into the same result. You can also gate it with a variable, `@defer(if: $deferReviews)`, which is handy when the same fragment serves a server render that wants everything at once.

`@stream` is the list version. It sends the first `initialCount` items in the initial payload and streams the rest:

```graphql
query Feed {
  feed(first: 100) @stream(initialCount: 10) {
    id
    title
  }
}
```

That pairs well with a resolver that returns an async iterable, since the executor can push each item as soon as it exists.

## Wiring it up on the server

GraphQL.js 17 shipped stable in June 2026 with `@defer` and `@stream` included but deliberately opt-in. The directives are not part of `specifiedDirectives`, so you add them yourself, and you run operations through a separate executor:

```ts
import {
  GraphQLSchema,
  GraphQLDeferDirective,
  GraphQLStreamDirective,
  specifiedDirectives,
  experimentalExecuteIncrementally,
  parse,
} from "graphql";

const schema = new GraphQLSchema({
  query: QueryType,
  // Passing `directives` replaces the defaults, so keep specifiedDirectives
  directives: [
    ...specifiedDirectives,
    GraphQLDeferDirective,
    GraphQLStreamDirective,
  ],
});

const result = await experimentalExecuteIncrementally({
  schema,
  document: parse(source),
  variableValues,
});

if ("initialResult" in result) {
  send(result.initialResult);
  for await (const patch of result.subsequentResults) {
    send(patch);
  }
} else {
  send(result);
}
```

Two details bite people here. First, forgetting `...specifiedDirectives` silently drops `@skip`, `@include`, and friends. Second, the plain `execute()` function rejects schemas that contain these directives, so every code path that executes operations needs to switch.

GraphQL.js produces the payloads but not the wire format. Your server picks the framing, usually HTTP multipart (`multipart/mixed`), sometimes server-sent events. Apollo Router supports `@defer` out of the box, so if your graph sits behind it you may already have this plumbing.

## The client has to speak the same dialect

This is the part to slow down on. Incremental delivery is still a draft in the GraphQL spec (the RFC reached Stage 2 in March 2026 and is still being edited), and the response format has changed more than once along the way. Apollo Client 4 refuses to guess. Out of the box it throws if it sees `@defer`, and you have to opt into a specific format:

```ts
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { Defer20220824Handler } from "@apollo/client/incremental";

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({ uri: "/graphql" }),
  incrementalHandler: new Defer20220824Handler(),
});
```

`Defer20220824Handler` matches the format Apollo Router ships. There is also a `GraphQL17Alpha9Handler` for servers built on the newer GraphQL.js format. Pick the one that matches what your server actually sends, then test a real deferred query end to end. A mismatch shows up as data that never merges, not as a helpful error.

In the UI, plan for fields that aren't there yet. In Apollo Client 4, `dataState` moves from `"empty"` to `"streaming"` to `"complete"`, and `loading` stays `true` until the last patch lands:

```tsx
const { data, dataState } = useQuery(PRODUCT_PAGE, { variables: { id } });

if (dataState === "empty") return <Skeleton />;

return (
  <>
    <ProductHeader product={data.product} />
    {data.product.reviews ? (
      <Reviews items={data.product.reviews} />
    ) : (
      <ReviewsSkeleton />
    )}
  </>
);
```

Reserve space for the deferred section so the late data doesn't shove the page around. Otherwise you trade a slow load for a layout shift.

## When not to bother

`@defer` fixes one problem: a fast majority waiting on a slow minority. If everything in the query is slow, deferring just adds payloads. If the slow field is slow because of an N+1 query, fix the resolver with batching first. Deferring a bad resolver hides the cost from the user while your database keeps paying it. Some gateways also don't support it yet, so check every hop between the client and the resolver before you count on it.

If your screens do have that "nine fast fields and one slow one" shape, `@defer` is worth an afternoon. Start with one below-the-fold section, measure time to first render before and after, and read the [GraphQL.js defer and stream guide](https://www.graphql-js.org/docs/defer-stream/) and the [Apollo Client @defer docs](https://www.apollographql.com/docs/react/data/defer) before you choose a format.
