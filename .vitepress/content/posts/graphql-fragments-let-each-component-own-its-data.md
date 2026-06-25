---
date: '2026-06-25T16:41:14.000+00:00'
tags: ['javascript', 'graphql', 'typescript', 'react']
draft: true
title: "GraphQL Fragments: Let Each Component Own Its Data"
image: '/images/posts/graphql-fragments-let-each-component-own-its-data.jpg'
topic: 'development'
description: "GraphQL fragments let each component declare exactly the fields it needs, eliminating overfetching and the hidden dependencies that make GraphQL codebases painful to refactor."
---

A GraphQL query looks clean when you first write it. One request, all the data you need, no waterfall. Then the app grows. The top-level page query starts picking up fields for five different child components. You add an avatar URL for a new `<UserBadge>` and six weeks later you remove the component but forget the field. Nobody knows what's safe to delete. The query keeps growing.

Fragments are the tool GraphQL gives you to fix this — and most teams underuse them, treating them as a shorthand for copy-pasting field lists rather than as a component ownership model.

## What Fragments Actually Are

A fragment is a named, reusable selection of fields scoped to a specific type:

```graphql
fragment UserBadge on User {
  id
  name
  avatarUrl
}
```

You spread it into any query or other fragment that selects from `User`:

```graphql
query GetPost($id: ID!) {
  post(id: $id) {
    title
    author {
      ...UserBadge
    }
  }
}
```

That's the basic syntax. The real value comes from where you put the fragment definition — not in a shared `fragments.ts` file, but in the same file as the component that uses the data.

## The Co-location Pattern

Co-location means each component declares the fragment it needs right alongside its JSX. Here's what that looks like with Apollo Client:

```tsx
import { gql, useFragment } from '@apollo/client'

// Declared next to the component that owns this data
export const USER_BADGE_FRAGMENT = gql`
  fragment UserBadge on User {
    id
    name
    avatarUrl
  }
`

export function UserBadge({ userRef }: { userRef: UserBadge$key }) {
  const user = useFragment(USER_BADGE_FRAGMENT, userRef)
  return (
    <div>
      <img src={user.avatarUrl} alt={user.name} />
      <span>{user.name}</span>
    </div>
  )
}
```

The parent component spreads the fragment without knowing what fields it contains:

```tsx
import { USER_BADGE_FRAGMENT } from './UserBadge'

const GET_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      title
      author {
        ...UserBadge
      }
    }
  }
  ${USER_BADGE_FRAGMENT}
`
```

Now when `UserBadge` needs a `role` field, you add it to the fragment. The query picks it up automatically. When you delete `UserBadge`, you delete its fragment too, and the query shrinks. The parent never had to know about `avatarUrl` in the first place.

## Data Masking: Enforcing the Boundary

Co-location by convention is good. Data masking makes it a hard rule.

With masking enabled (available in Apollo Client 3.12+ and built into Relay by design), a component can only access fields it explicitly requested in its own fragment. Even if the network response contains `avatarUrl` because another component requested it, your component gets `undefined` unless it declared the field itself.

```tsx
// Without masking: this might work accidentally because a sibling
// component requested avatarUrl in its fragment
const { data } = useQuery(GET_POST)
console.log(data.post.author.avatarUrl) // could be undefined tomorrow if UserBadge moves

// With masking + useFragment: TypeScript errors immediately if you
// access a field your fragment didn't declare
const user = useFragment(USER_BADGE_FRAGMENT, userRef)
console.log(user.avatarUrl) // always safe — it's in YOUR fragment
```

The TypeScript types generated from your fragments encode this contract. If you remove `avatarUrl` from `UserBadge_Fragment`, the TypeScript compiler tells you everywhere you were using it. Refactors that used to require grepping the whole codebase become a type-check run.

Tools like `gql.tada` and `graphql-code-generator` with the `client-preset` generate these types automatically from your fragment definitions, so the feedback loop is tight.

## When to Reach for This Pattern

You don't need fragments for a simple app with three queries. The pattern earns its keep when:

- Multiple components read from the same type (User, Product, Post)
- Your page-level queries are getting long and nobody is sure what each field is for
- You've been bitten by "I removed a component but left its fields in the query"
- You want TypeScript safety at the data-access level, not just at the query level

Start by identifying one component that fetches its own fields via a parent query. Extract those fields into a fragment, move the definition next to the component, and spread it from the parent. That single refactor will make the pattern obvious, and you'll naturally apply it as you go.

GraphQL's promise is that your data fetching reflects exactly what your UI needs. Fragments are what make that promise hold as the UI grows.
