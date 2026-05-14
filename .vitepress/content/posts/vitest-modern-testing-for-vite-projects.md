---
created_at: "2026-02-26T14:14:00.000-08:00"
tags: ["testing", "tooling", "javascript", "typescript"]
draft: false
title: "Vitest: Modern Unit Testing That Doesn't Fight Your Toolchain"
image: "/images/posts/vitest-modern-testing-for-vite-projects.jpg"
topic: "development"
description: "Vitest brings Jest-compatible testing to Vite projects with native TypeScript support, in-source tests, and a dramatically faster watch mode. Here's how to get started."
---

Testing in JavaScript projects has historically involved a wall of configuration: Babel transforms, Jest module mappers, manual mocks for imports, and a test environment that subtly differs from how your production bundler sees the code. Vitest fixes most of this by reusing your Vite config and treating tests as first-class citizens of the same build graph.

## Zero-Config for Vite Projects

If you already have a `vite.config.ts`, Vitest reads it automatically. Your path aliases, plugins, and environment variables work in tests without duplication:

```bash
npm install -D vitest
```

```ts
// vite.config.ts — Vitest reads this directly
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    // Vitest config lives alongside Vite config
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

## The API Is Jest-Compatible

Migration from Jest is mostly search-and-replace on imports. The core APIs (`describe`, `it`, `expect`, `vi`) work identically:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatCurrency } from "@/utils/currency";
import { fetchProduct } from "@/api/products";

vi.mock("@/api/products");

describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
  });

  it("handles zero", () => {
    expect(formatCurrency(0, "USD")).toBe("$0.00");
  });
});

describe("fetchProduct", () => {
  beforeEach(() => {
    vi.mocked(fetchProduct).mockResolvedValue({ id: "1", name: "Widget" });
  });

  it("returns a product", async () => {
    const product = await fetchProduct("1");
    expect(product.name).toBe("Widget");
  });
});
```

`vi.mock()` hoists automatically (like Jest's `jest.mock()`), and `vi.mocked()` provides the TypeScript-aware typed mock reference.

## In-Source Testing

One of Vitest's unique features is in-source tests — embedding tests directly in your source file behind an `import.meta.vitest` guard:

```ts
// src/utils/math.ts

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Tests live next to the function — zero file-switching
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("clamps to min", () => expect(clamp(-5, 0, 10)).toBe(0));
  it("clamps to max", () => expect(clamp(15, 0, 10)).toBe(10));
  it("passes through in range", () => expect(clamp(5, 0, 10)).toBe(5));
}
```

The `import.meta.vitest` block is tree-shaken out of production builds entirely, so there's zero runtime cost. This pattern works especially well for utility functions and business logic — the tests stay next to the code they test.

## Watch Mode and UI

Vitest's watch mode is meaningfully faster than Jest's because it uses Vite's module graph to know exactly which tests to re-run when a file changes. Only the affected test files run — not the whole suite.

```bash
# Interactive watch mode
vitest

# Run with the browser-based UI
vitest --ui
```

The `--ui` flag opens a visual test runner in your browser showing pass/fail status, test durations, coverage visualization, and a module graph view. It's surprisingly useful for understanding test coverage in complex module hierarchies.

If you're starting a new Vite project and need unit testing, Vitest is the default choice. For existing Jest setups, the migration path is gradual enough that you can move over incrementally without rewriting anything.
