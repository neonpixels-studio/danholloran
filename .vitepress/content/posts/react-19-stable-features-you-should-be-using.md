---
created_at: "2026-01-25T09:22:00.000-08:00"
tags: ["react", "javascript", "typescript"]
draft: false
title: "React 19: The Stable Features You Should Actually Be Using"
image: "/images/posts/react-19-stable-features-you-should-be-using.jpg"
topic: "development"
description: "React 19 went stable in December 2024. Actions, the use() API, new hooks, and document metadata support are all production-ready. Here's what's worth adopting first."
---

React 19 went stable in December 2024, and the announcement was notable for how much it landed at once: Actions, a new set of hooks, the `use()` API, Server Components in stable, and native document metadata support. Not all of it is relevant for every project, but some of it changes how you'll write React code going forward.

## Actions: Async State Without the Boilerplate

The old pattern for handling form submissions or async mutations in React involved manually managing pending, error, and success states. React 19 formalizes the "async function that updates state" concept into _Actions_, which the new hooks integrate with:

```tsx
// Before React 19: manual state management
function UpdateNameForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    try {
      await updateName(new FormData(e.target).get("name"));
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }
  // ...
}

// React 19: useActionState handles pending/error automatically
function UpdateNameForm() {
  const [error, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      const error = await updateName(formData.get("name"));
      if (error) return error;
      return null;
    },
    null,
  );

  return (
    <form action={submitAction}>
      <input name="name" />
      <button disabled={isPending}>{isPending ? "Saving..." : "Save"}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

The `action` prop on `<form>` is now a first-class React concept. You can pass an async function directly, and React handles the pending state lifecycle.

## The `use()` API

`use()` is a new hook-like function that can read a promise or context inside render — including conditionally, which regular hooks can't do:

```tsx
import { use, Suspense } from "react";

// Read a promise in render — component suspends until resolved
function UserProfile({ userPromise }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

// Wrap with Suspense to handle the loading state
function App() {
  const userPromise = fetchUser(userId);
  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}

// Read context conditionally (regular useContext can't do this)
function ThemedButton({ showTheme }) {
  if (showTheme) {
    const theme = use(ThemeContext);
    return <button style={{ color: theme.primary }}>Click</button>;
  }
  return <button>Click</button>;
}
```

## `useOptimistic` for Instant-Feeling UIs

`useOptimistic` manages the common pattern of showing a UI update immediately while the server request is in-flight, then reconciling when the real response arrives:

```tsx
function TodoList({ todos, addTodo }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }],
  );

  async function handleAdd(formData) {
    const newTodo = { text: formData.get("text"), id: crypto.randomUUID() };
    addOptimisticTodo(newTodo); // Updates UI immediately
    await addTodo(newTodo); // Real server call
  }

  return (
    <ul>
      {optimisticTodos.map((todo) => (
        <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

## Native Document Metadata

React 19 lets you render `<title>`, `<meta>`, and `<link>` tags anywhere in your component tree and React hoists them to `<head>` automatically:

```tsx
function ProductPage({ product }) {
  return (
    <>
      <title>{product.name} | My Shop</title>
      <meta name="description" content={product.description} />
      <link
        rel="canonical"
        href={`https://shop.example.com/products/${product.slug}`}
      />
      <h1>{product.name}</h1>
    </>
  );
}
```

This replaces most of what `react-helmet` or `react-helmet-async` was used for. It works with SSR and streaming out of the box.

React 19 is a meaningful quality-of-life release. `useActionState` and `useOptimistic` alone will clean up significant amounts of repetitive state management code in most real-world apps.
