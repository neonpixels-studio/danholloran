---
date: "2026-08-06T02:07:58.000-05:00"
tags: ["graphql", "typescript", "tooling", "node"]
draft: false
title: "GraphQL Trusted Documents: Stop Letting Strangers Write Your Queries"
image: "/images/posts/graphql-trusted-documents-stop-letting-strangers-write-your-queries.jpg"
topic: "development"
description: "Disabling introspection is not security. Trusted documents let your server execute only the operations your own developers wrote, and you probably already have the tooling for it."
---

Somewhere in your codebase there is a GraphQL endpoint sitting on the public internet, and it will happily execute any document a stranger sends it. Maybe you turned off introspection and called it a day. That is security through obscurity, and it holds up about as well as you'd expect: attackers pull field names out of error messages, sniff the network traffic your own app produces, or just fuzz until something returns a 200.

The fix has been sitting in front of us since before GraphQL was open sourced. Facebook has used it internally the whole time. It's called an operation allowlist, and the current name for the good version of it is **trusted documents**.

## What a trusted document actually is

In spec terms, an [executable document](https://spec.graphql.org/draft/#ExecutableDocument) is the text string containing your queries, mutations, subscriptions, and their fragments. A trusted document is one of those, identified by a hash, that your server trusts because it came through your normal development process: written by your developers, reviewed, passed CI, stored somewhere you control.

The mechanics are almost boringly simple. At build time you extract every document your client uses and hash it with SHA-256. At run time the client sends `documentId` instead of `query`. The server looks the hash up, finds the document, and executes it. No hash, no execution.

This is worth separating from a similarly named thing. **Automatic persisted queries (APQ)** also send hashes instead of query text, but APQ lets the client register any document it likes on first request. It's a bandwidth optimization, not a security control. If your server has APQ switched on while you're rolling out trusted documents, you've left the door you just locked propped open. Turn it off.

## Wiring it up

If you already run codegen for type safety, most of the client work is a config flag. GraphQL Code Generator's client preset will emit a `persisted-documents.json` mapping hashes to operations:

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "schema.graphql",
  documents: ["src/**/*.tsx"],
  generates: {
    "./src/gql/": {
      preset: "client",
      presetConfig: {
        persistedDocuments: true,
      },
    },
  },
};

export default config;
```

The default hash algorithm is SHA-256, which is what the GraphQL-over-HTTP spec expects for persisted document identifiers. Ship that JSON file to wherever your server can read it. In a monorepo, committing the operations as `.trusted_documents/<hash>.graphql` works nicely and gives you a git history of exactly when each operation entered the allowlist. Otherwise have CI POST the map to an authenticated endpoint that writes it to Redis, S3, or a table.

Server support varies. Yoga, Apollo, Relay's runtime, urql, and gql.tada all have a story here. If yours doesn't, it's about fifteen lines of middleware:

```ts
app.post("/graphql", async (req, res, next) => {
  const documentId = req.body?.documentId;
  if (typeof documentId !== "string") {
    return next(new Error("This server only accepts trusted documents."));
  }

  const document = await loadDocumentByIdentifier(documentId);
  if (!document) {
    return next(new Error("Unknown document identifier."));
  }

  delete req.body.documentId;
  req.body.query = document;
  next();
});
```

Put an LRU cache in front of `loadDocumentByIdentifier` and you're done. If you're retrofitting an existing API, run in audit mode first: log the hashes of everything in flight for a few weeks so you don't break a mobile client that's three App Store releases behind.

## The part people skip

Trusted documents shrink your attack surface enormously, but they do not make your queries safe. An attacker can't send you a new document, but they can absolutely take one of yours and feed it hostile variables. Consider a perfectly reasonable operation you'd approve in review:

```graphql
query TopUsers($limit: Int! = 10) {
  topUsers(first: $limit) {
    id
    name
    avatar
  }
}
```

Send that with `$limit: 2147483647` and your database is now on the hook for two billion rows. Depth limits, pagination caps, and cost analysis still matter. The difference is that you now enforce them **once, at persist time**, against a finite set of documents you control, instead of on every request against arbitrary input. That's a much better place to spend the cycles.

The same trick applies to complex filter inputs: bake as much of the filter into the document as you can and leave only leaf values as variables.

## The bonus you didn't ask for

Once the server holds every operation your clients can run, you get a perfect usage map for free. Wondering whether it's safe to delete a field? Remove it, validate the whole trusted document set against the new schema, and let the failures tell you. Schema evolution stops being an archaeology project.

Add the bandwidth savings and the option of GET-based HTTP caching per document, and the security win starts to look like the smallest reason to do this. If your GraphQL API only serves your own apps — and most do — spend an afternoon on it.
