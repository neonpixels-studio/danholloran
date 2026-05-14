---
created_at: '2026-04-01T18:44:00.000-08:00'
tags: ['react', 'javascript', 'typescript']
draft: true
title: "Zustand: Lightweight State Management That Stays Out of Your Way"
image: '/images/posts/zustand-lightweight-state-management-that-stays-out-of-your-way.jpg'
topic: 'development'
description: "Zustand is a minimal global state library for React that skips the boilerplate entirely. Here's how it works, when to reach for it, and patterns that scale well."
---

Global state in React has a complicated history. Redux introduced rigorous patterns but at a verbosity cost that led to years of middleware wrappers trying to smooth it over. Context works for low-frequency updates but is famously problematic for high-frequency state. Zustand occupies a comfortable middle ground: it's a tiny library (around 1KB) that gives you a global store with minimal ceremony and no opinions about folder structure.

## A Store Is Just a Hook

The core concept in Zustand is simple — a store is a custom hook that holds state and actions together:

```ts
import { create } from 'zustand';

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  total: 0,

  addItem: (item) =>
    set((state) => {
      const items = [...state.items, item];
      return { items, total: items.reduce((sum, i) => sum + i.price, 0) };
    }),

  removeItem: (id) =>
    set((state) => {
      const items = state.items.filter((i) => i.id !== id);
      return { items, total: items.reduce((sum, i) => sum + i.price, 0) };
    }),

  clearCart: () => set({ items: [], total: 0 }),
}));
```

That's the entire store definition. No action types, no reducers, no dispatch. Consume it in any component:

```tsx
function CartSummary() {
  const { items, total } = useCartStore();
  return (
    <div>
      <span>{items.length} items</span>
      <span>${total.toFixed(2)}</span>
    </div>
  );
}

function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  return (
    <button onClick={() => addItem({ id: product.id, price: product.price, name: product.name })}>
      Add to Cart
    </button>
  );
}
```

## Selective Subscriptions Prevent Re-Renders

A common mistake with Zustand is destructuring everything from the store hook. This subscribes the component to all state changes, which defeats the purpose:

```ts
// Bad: re-renders whenever any store value changes
const { items, total, addItem } = useCartStore();

// Good: re-renders only when total changes
const total = useCartStore((state) => state.total);

// Good: stable reference to an action, never re-renders from it
const addItem = useCartStore((state) => state.addItem);
```

Selectors are functions, so you can derive computed values inline:

```ts
const itemCount = useCartStore((state) => state.items.length);
const hasItem = useCartStore((state) =>
  state.items.some((i) => i.id === productId)
);
```

## Middleware for Common Patterns

Zustand ships with middleware for persistence, devtools integration, and Immer-style mutations:

```ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      immer((set) => ({
        theme: 'light' as 'light' | 'dark',
        fontSize: 16,

        setTheme: (theme) =>
          set((state) => {
            // Immer lets you mutate directly — no spread required
            state.theme = theme;
          }),

        increaseFontSize: () =>
          set((state) => {
            state.fontSize = Math.min(state.fontSize + 2, 24);
          }),
      })),
      { name: 'settings-store' } // localStorage key
    )
  )
);
```

The `persist` middleware syncs to `localStorage` automatically. The `devtools` middleware connects to Redux DevTools for time-travel debugging. The `immer` middleware lets you write mutations without spreading.

## When to Use Zustand vs. Other Options

Zustand is ideal for global UI state that multiple components need — user preferences, modal state, cart contents, sidebar open/closed. For server data (things that come from an API and need caching), pair it with TanStack Query instead of storing fetched data in Zustand. The two libraries complement each other well: TanStack Query handles server state, Zustand handles client state.

Zustand's simplicity is a genuine strength. When the state model fits in your head in five minutes, you spend your time building features rather than state architecture.
