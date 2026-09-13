---
date: "2026-09-13T02:07:54.000-07:00"
tags: ["graphql", "typescript", "web-apis", "tooling"]
draft: false
title: "GraphQL @oneOf: Exactly One Input, Enforced by the Schema"
image: "/images/posts/graphql-oneof-exactly-one-input-enforced-by-the-schema.jpg"
topic: "development"
description: "OneOf Input Objects landed in the September 2025 GraphQL spec, which means the exactly-one-of-these-arguments rule you've been enforcing in resolver code is now something the type system can do for you."
---

Every GraphQL schema I've worked on eventually grows a field that can be looked up more than one way. You want a user by ID, or by email, or by username. The type system has no way to say "exactly one of these," so you pick one of two bad options: three root fields that do the same thing, or one field with three nullable arguments and a pile of validation at the top of the resolver.

The second option is the one most teams land on, and it's the one that rots. The schema advertises three optional arguments, which is a lie — two of the three combinations are errors. Your introspection-driven tooling can't see that. Your generated TypeScript types can't see it either, so the client happily compiles code that sends all three and finds out at runtime.

OneOf Input Objects fix this, and as of the [September 2025 edition of the spec](https://spec.graphql.org/September2025/#sec-OneOf-Input-Objects) they are no longer an experiment you have to opt into.

## The directive is the whole feature

You mark an input object with `@oneOf` and the executor enforces that callers supply exactly one field, with a non-null value:

```graphql
input UserBy @oneOf {
  id: ID
  email: String
  username: String
}

type Query {
  user(by: UserBy!): User
}
```

Three root fields collapse into one. The constraint lives in the schema instead of in a guard clause, and validation happens before your resolver runs.

Two rules matter when you're writing these. Fields on a `@oneOf` input must be nullable, and they must not declare defaults. Both fall out of the semantics: a non-null field would be required, which contradicts "pick one," and a default would silently supply a second value. If you try it, your server will reject the schema at build time rather than at query time.

It's worth noting the constraint is about the field being _provided_, not about it being truthy. Passing `{ id: null }` is a validation error, not a lookup for a null ID. That distinction bites people migrating from hand-rolled validation, where `null` and "absent" usually got collapsed into the same branch.

## It's not just scalars

The more interesting use is polymorphic input. GraphQL has had union types on the output side since forever and nothing equivalent on the input side. `@oneOf` is the closest thing we have:

```graphql
type Mutation {
  createPost(elements: [PostElementInput!]!): Post
}

input PostElementInput @oneOf {
  paragraph: ParagraphInput
  blockquote: BlockQuoteInput
  gallery: GalleryInput
}

input ParagraphInput {
  text: String!
}

input GalleryInput {
  imageUrls: [String!]!
  caption: String
}
```

A block editor sends a heterogeneous list of elements, each one tagged by which field it occupies, and every branch keeps its own required fields. Before this, that shape was a `JSON` scalar with a comment above it apologizing.

One sharp edge: recursive `@oneOf` inputs are only valid if some branch can terminate. An input whose single field points back at itself has no finite value a client could ever send, and a spec-compliant server will reject it. If you need recursion, give it an escape hatch — a scalar branch, or route the cycle through a regular nullable input field.

## The client story is still catching up

Server support is broad. GraphQL.js v16+, GraphQL Ruby v2.0.21+, GraphQL Java v21.2+, GraphQL.NET v8+, HotChocolate v16+, Strawberry v0.230.0+, graphql-core v3.3.0+, and webonyx/graphql-php v15.21.0+ all ship it. GraphQL.js v17 tightened coercion further, so schemas that quietly relied on ambiguous inputs will now fail earlier and with better messages.

Codegen is the weaker link. The ideal output is a discriminated union:

```ts
type UserBy =
  | { id: string; email?: never; username?: never }
  | { id?: never; email: string; username?: never }
  | { id?: never; email?: never; username: string };
```

That's what you want, because TypeScript will then reject the two-field call at compile time. Whether you actually get it depends on your generator and its config — support has been uneven, and combinations like `@oneOf` plus the `interface` output setting have known rough edges. Check what your pipeline emits before assuming the guarantee reaches your client code.

If you're designing a new lookup or mutation input this week, reach for `@oneOf` first. It's a backward-compatible addition, existing clients keep working, and it moves a rule out of your resolver and into the one place every consumer of your API can already see.
