---
date: "2026-05-26T07:09:43.000+00:00"
tags: ["javascript", "typescript", "tooling", "jamstack"]
draft: false
title: "Astro Actions: Type-Safe Server Functions Without the Boilerplate"
image: "/images/posts/astro-actions-type-safe-server-functions-without-the-boilerplate.jpg"
topic: "development"
description: "Astro Actions let you define backend functions once and call them from HTML forms or client JavaScript with full type safety — no REST endpoints, no manual fetch, no type casting."
---

You've got a contact form in your Astro site. The classic approach: write an API endpoint at `src/pages/api/contact.ts`, parse `formData` by hand, validate the fields yourself, and then write a client-side `fetch()` call that knows nothing about the shape of the data it's sending. You end up touching four files to wire up one form, and TypeScript can't help you across the boundary.

Astro Actions, stable since Astro 5, solve this in a way that actually feels like a step forward rather than a workaround.

## What Astro Actions Are

An action is a typed server function you define once and call from anywhere — an HTML form, a client-side script, or a React/Vue/Svelte island. The framework handles the HTTP transport, body parsing, and Zod validation automatically. What you get back on the client is fully typed, which means you catch mistakes at compile time instead of at runtime.

All actions live in `src/actions/index.ts` inside an exported `server` object:

```ts
// src/actions/index.ts
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const server = {
  contact: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email address"),
      message: z.string().min(10, "Message too short"),
    }),
    handler: async ({ name, email, message }) => {
      // This runs on the server. Send an email, write to a DB, whatever.
      await sendEmail({ name, email, message });
      return { success: true };
    },
  }),
};
```

The `accept: 'form'` tells Astro to parse `FormData` automatically — no `formData.get('email')` calls, no casting to `string`. The Zod schema does the validation, and the `handler` gets a typed object. If validation fails, Astro returns structured field-level errors before your handler even runs.

## Calling Actions From a Form

The simplest integration requires zero JavaScript on the client. Just point the form's `action` attribute at the action using Astro's helper:

```astro
---
// src/pages/contact.astro
import { actions } from 'astro:actions';
---

<form method="POST" action={actions.contact}>
  <input name="name" type="text" placeholder="Your name" />
  <input name="email" type="email" placeholder="Email" />
  <textarea name="message" rows="5"></textarea>
  <button type="submit">Send</button>
</form>
```

That's the whole progressive-enhancement story: the form submits without JS, the action runs on the server, and you get a redirect back. Add a client-side handler and you get instant feedback without a full page reload — your choice.

For the JS-enhanced version, reading action results and rendering errors stays clean:

```ts
// client-side script in the same .astro file
import { actions, isInputError } from "astro:actions";

document.querySelector("form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget as HTMLFormElement);
  const { data, error } = await actions.contact.safe(formData);

  if (error && isInputError(error)) {
    // error.fields.name, error.fields.email, etc. — all typed
    console.error(error.fields);
    return;
  }

  if (data?.success) {
    // Show a success message
  }
});
```

The `.safe()` variant returns `{ data, error }` instead of throwing, which is usually what you want in UI code. The `isInputError()` type guard narrows the error to one with a `fields` object that matches your Zod schema — field names are autocompleted, no guessing.

## Calling Actions From Islands

If you're working with a React or Svelte island, actions work just as well. No `fetch()`, no URL to remember:

```tsx
// src/components/ContactForm.tsx
import { actions, isInputError } from "astro:actions";
import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { data, error } = await actions.contact.safe(formData);

    if (error && isInputError(error)) {
      setFieldErrors(error.fields as Record<string, string[]>);
      setStatus("error");
    } else if (data?.success) {
      setStatus("success");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" type="text" />
      {fieldErrors.name && <p className="error">{fieldErrors.name[0]}</p>}
      <input name="email" type="email" />
      {fieldErrors.email && <p className="error">{fieldErrors.email[0]}</p>}
      <textarea name="message" rows={5} />
      <button type="submit">Send</button>
      {status === "success" && <p>Message sent!</p>}
    </form>
  );
}
```

Actions also accept JSON payloads — drop `accept: 'form'` (JSON is the default) and call the action directly with an object:

```ts
const { data, error } = await actions.newsletter.safe({
  email: "dan@example.com",
});
```

That's useful for actions triggered by button clicks or other non-form interactions.

## When to Reach For Actions

Actions are a great fit for forms, mutations, and any server-side logic you'd otherwise expose as a one-off API endpoint. They're not a replacement for proper REST or GraphQL APIs when you need something external clients can consume — but for internal Astro-to-server communication, they cut the boilerplate dramatically.

The type safety across the network boundary is the real win. Once you've defined your Zod schema, your IDE knows the shape of the response and the structure of any validation errors. You stop writing `as string` and start trusting the compiler.

The official [Astro Actions docs](https://docs.astro.build/en/guides/actions/) are thorough and worth reading once you've got the basics down — there's more to explore around middleware-level action handling and using actions with `useActionState` in React 19.
