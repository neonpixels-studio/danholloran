---
date: '2026-11-05T08:06:24.000-08:00'
tags: ['tooling', 'javascript', 'typescript', 'testing']
draft: false
title: "Oxlint JS Plugins: Your Custom ESLint Rules No Longer Keep You on ESLint"
image: '/images/posts/oxlint-js-plugins-your-custom-eslint-rules-no-longer-keep-you-on-eslint.jpg'
topic: 'development'
description: "Oxlint now runs ESLint plugins and your own custom rules, so the last excuse for a slow lint step is gone. Here's how JS plugins work, how to migrate, and where the gaps still are."
---

Every team that has looked at Oxlint has hit the same wall. The benchmarks are great, the built-in rules cover most of what you use, and then someone remembers the twelve custom rules in `eslint-local-rules/`, plus `eslint-plugin-testing-library`, plus that one SonarJS rule the security folks insisted on. None of that exists in Rust, so the migration dies in the planning doc and CI keeps spending two minutes on linting.

That wall is mostly gone now. Oxlint's JavaScript plugin support hit alpha in March 2026, and the Oxc team's claim is that roughly 80% of ESLint users can switch and have it "just work." The interesting part is how they got there: an ESLint-compatible plugin API running beside the native Rust rules, so you keep your rules and only pay JavaScript prices for the rules that actually need JavaScript.

## Existing plugins: point at them and go

JS plugins are loaded through a `jsPlugins` array in your config. Any valid import specifier works, whether that's an npm package or a local file, and paths resolve relative to the config file.

```json
{
  "jsPlugins": ["eslint-plugin-testing-library", "./lint/local-rules.js"],
  "rules": {
    "testing-library/no-render-in-lifecycle": "error",
    "local-rules/no-legacy-api-client": "error"
  }
}
```

The compatibility story is backed by numbers rather than vibes. Oxc runs its JS plugin layer against ESLint's own rule test suite (33,006 tests, 100% passing) and against popular plugins like `eslint-plugin-react-hooks`, ESLint Stylistic, Testing Library, and SonarJS, all at or near 100%. Plugins that aren't on that list will often work anyway, as long as they target the ESLint v9 API. Plugins still using APIs ESLint removed in v9 or earlier won't be patched up for you.

One wrinkle you'll hit quickly is name collisions. Oxlint natively implements some plugins (like `jsdoc` and `react`) but not every rule in them. Aliasing lets you use the native rules where they exist and fall back to the npm package for the rest:

```json
{
  "jsPlugins": [{ "name": "jsdoc-js", "specifier": "eslint-plugin-jsdoc" }],
  "rules": {
    "jsdoc/require-property-description": "error",
    "jsdoc-js/check-examples": "error"
  }
}
```

The same trick works for ESLint core rules that Oxlint hasn't ported yet. The `oxlint-plugin-eslint` package ships all of ESLint's built-ins as a JS plugin under the `eslint-js` prefix, which is how you get `no-restricted-syntax` and its AST selectors back.

## Writing rules: same API, one optional tweak

If you've written an ESLint rule before, you already know how to write an Oxlint rule. The plain `create(context)` shape works unchanged. Oxlint also offers an alternative `createOnce` API that's worth adopting for anything new:

```js
// lint/local-rules.js
import { eslintCompatPlugin } from '@oxlint/plugins'

const noLegacyApiClient = {
  createOnce(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === '@/lib/legacy-api') {
          context.report({
            node,
            message: 'Use the generated client in @/lib/api instead.',
          })
        }
      },
    }
  },
}

export default eslintCompatPlugin({
  meta: { name: 'local-rules' },
  rules: { 'no-legacy-api-client': noLegacyApiClient },
})
```

The difference is that ESLint's `create` runs once per file, so the linter has to call into JavaScript just to find out which AST nodes your rule cares about. `createOnce` runs a single time, which lets Oxlint learn your visitor up front and, eventually, skip files that contain none of those nodes without crossing the Rust/JS boundary at all. Any per-file state moves into a `before()` hook. The docs are candid that this doesn't make rules faster yet; it positions them to get faster for free in later releases. And because `eslintCompatPlugin` adds a `create` shim, the same plugin still runs in plain ESLint, which matters during a gradual migration.

For tests, `oxlint/plugins-dev` exports a `RuleTester` modeled on ESLint's, and it slots into Vitest by assigning `RuleTester.describe` and `RuleTester.it`.

## Migrating, and what still doesn't fit

The migration path is a single command against your flat config:

```bash
npx @oxlint/migrate eslint.config.js
```

On the Node.js repo (6,298 files, 98 JS rules including 23 custom ones) the Oxc team measured ESLint at 1 minute 43 seconds and Oxlint at 21 seconds. That 4.8x is the low end, because so much of that project's rule set still runs in JavaScript. Projects leaning on typescript-eslint see bigger wins, since type-aware linting went stable in July 2026 with 59 of typescript-eslint's 61 type-aware rules running on the Go-based TypeScript 7 compiler. Turn it on with `"options": { "typeAware": true }` and use `oxlint --type-aware --debug timings` to find out which rules are eating your lint budget.

Before you rip ESLint out, check three things:

- **Vue, Svelte, and Angular templates.** Custom file formats and parsers aren't supported for JS plugins yet. If your rules need to see `<template>` blocks, keep ESLint for those files for now.
- **Custom type-aware rules.** typescript-eslint's rules are built in, but your own rules can't ask the type checker anything yet.
- **Slow plugins stay slow.** Oxlint gives your rules a fast parser, but a plugin that hits the filesystem on every node is just as expensive here. If you lint formatting with ESLint Stylistic, moving that work to a formatter is the bigger win.

Oxlint also runs fine alongside ESLint, so the low-risk move is to let Oxlint handle everything it can and shrink your ESLint config down to the leftovers. Start with `@oxlint/migrate`, read what it couldn't convert, and decide from there. The [JS plugins guide](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) and [writing plugins docs](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) cover the rest.
