---
created_at: "2026-03-17T09:01:00.000-08:00"
tags: ["javascript", "react", "typescript", "tooling"]
draft: false
title: "TanStack Query v5: Data Fetching Done Right"
image: "/images/posts/tanstack-query-v5-data-fetching-done-right.jpg"
topic: "development"
description: "TanStack Query v5 cleaned up the API, unified the mental model, and added first-class support for infinite queries and streaming. Here's what changed and why the library remains the standard."
---

If you've spent any time managing server state in a React app, you've probably reached for TanStack Query (formerly React Query). Version 5 landed with a smaller, more consistent API and a handful of genuinely useful additions. If you're still on v4 or evaluating the library for the first time, here's what you need to know.

## The Unified Object Syntax

The most visible change in v5 is that all hooks now require an options object. In v4, `useQuery` accepted positional arguments — query key, query function, options. v5 collapses these into a single object:

```ts
// v4 — positional arguments
const { data } = useQuery(["user", userId], () => fetchUser(userId), {
  staleTime: 5 * 60 * 1000,
});

// v5 — single options object
const { data } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000,
});
```

This breaks existing code, but the migration codemod handles most cases automatically:

```bash
npx jscodeshift ./src -t node_modules/@tanstack/react-query/build/codemods/v5/remove-overloads/remove-overloads.cjs
```

The benefit is a consistent shape across all hooks — `useQuery`, `useMutation`, `useInfiniteQuery`, `useSuspenseQuery` all follow the same pattern. It's easier to extract shared option objects and compose them.

## Suspense as a First-Class Citizen

v5 ships `useSuspenseQuery` and `useSuspenseInfiniteQuery` as stable, dedicated hooks rather than an unstable flag:

```tsx
// useSuspenseQuery guarantees data is defined — no undefined check needed
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  // data is always User here, never undefined
  return <div>{user.name}</div>;
}

// Wrap with Suspense and ErrorBoundary
function App() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Skeleton />}>
        <UserProfile userId="123" />
      </Suspense>
    </ErrorBoundary>
  );
}
```

The non-suspense `useQuery` still returns `data: T | undefined` and requires you to handle the loading/error states inline. Pick the variant that matches your component's needs.

## Streamlined Infinite Queries

`useInfiniteQuery` got significant ergonomic improvements. The `initialPageParam` is now required (no more implicit `undefined` first page), and `getNextPageParam` has clearer typing:

```ts
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: ["posts", filters],
    queryFn: ({ pageParam }) => fetchPosts({ cursor: pageParam, ...filters }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
  });

// data.pages is an array of each page's result
const allPosts = data?.pages.flatMap((page) => page.items) ?? [];
```

The `maxPages` option is new in v5 — it caps how many pages are kept in memory, which matters for long scroll sessions:

```ts
useInfiniteQuery({
  // ...
  maxPages: 5, // Keep only the 5 most recent pages in cache
});
```

## Mutation Improvements

`useMutation` now accepts `mutationKey`, enabling you to observe and invalidate mutations from outside the component that created them — useful for coordinating between unrelated parts of the UI:

```ts
const mutation = useMutation({
  mutationKey: ["update-user"],
  mutationFn: (data: UpdateUserInput) => updateUser(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["user"] });
  },
});
```

TanStack Query remains the most principled solution for server state management in React. v5's API consolidation makes it easier to onboard new team members and reduces the surface area for inconsistency. The migration effort is worthwhile, and the codemod makes it manageable.
