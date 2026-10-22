---
date: "2026-10-22T02:16:26.000-07:00"
tags: ["typescript", "node", "tooling", "bundlers"]
draft: false
title: "Subpath Imports With #/: The Path Alias Node Actually Understands"
image: "/images/posts/subpath-imports-with-the-path-alias-node-actually-understands.jpg"
topic: "development"
description: "Node 24.14 and TypeScript 6.0 finally allow a bare #/ prefix in package.json imports. Here's how to replace tsconfig paths, Vite aliases, and post-build rewrites with one alias every tool reads."
---

Count the places your `@/` import alias is defined. There's `paths` in `tsconfig.json` so the editor stops complaining. There's `resolve.alias` in `vite.config.ts` so the dev server can find the file. If you run tests, there's probably `vite-tsconfig-paths` or a Jest `moduleNameMapper` doing the same job a third time. And if any of that code ever runs directly in Node, none of those configs help, because Node has never read a tsconfig in its life.

That arrangement got less comfortable this year. TypeScript 6.0 deprecated `baseUrl`, and the TypeScript 7 native compiler drops it entirely. Meanwhile the platform quietly fixed the thing that kept people from using the standard alternative. Node's `package.json` `imports` field now accepts a bare `#/` prefix, and TypeScript 6.0 understands it. You can have one alias, defined once, that every tool in the chain reads from the same place.

## What actually changed

Subpath imports have existed in Node since v14. The `imports` field in `package.json` lets a package define private specifiers that only resolve from inside that package. The rule is that every key must start with `#`, so nothing can collide with a real package name on npm.

The catch was that `#/` on its own was not a valid key. You had to write `#src/*` or `#lib/*` or `#root/*`, which always felt like inventing a name to satisfy a parser. People coming from bundlers wanted the `@/` feel, tried `#/`, got a resolution error, and went back to `paths`.

Node fixed that in v25.4.0 and backported it to v24.14.0, per the version history in the [Node.js packages docs](https://nodejs.org/api/packages.html#subpath-imports). TypeScript 6.0 added matching support under `moduleResolution` set to `nodenext` or `bundler`. So this is now legal:

```json
{
  "name": "my-app",
  "type": "module",
  "imports": {
    "#/*": "./src/*"
  }
}
```

```ts
import { formatPrice } from "#/utils/format.js";
import { useCart } from "#/composables/useCart.js";
```

The `*` is plain string replacement, so `#/utils/format.js` becomes `./src/utils/format.js`, nested folders included. TypeScript applies its usual `.js` to `.ts` lookup on the result, the same way it does for relative imports.

## Migrating a Vite app off `paths`

For a typical Vue or React project built with Vite, the move is mostly deletion. Add the `imports` field above, then strip the duplicates:

```diff
 // tsconfig.json
 {
   "compilerOptions": {
     "moduleResolution": "bundler",
-    "baseUrl": ".",
-    "paths": {
-      "@/*": ["./src/*"]
-    }
   }
 }
```

```diff
 // vite.config.ts
 export default defineConfig({
   plugins: [vue()],
-  resolve: {
-    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
-  },
 })
```

A current Vite release resolves the `imports` field natively, and Vitest inherits Vite's resolver, so the test config needs nothing extra. SvelteKit is already heading this way: the docs for its next version scaffold a `#lib` entry in `package.json` instead of the old built-in `$lib` alias.

Then rewrite the specifiers. Because the shape is identical, a find-and-replace from `'@/` to `'#/` covers most of a codebase. Run `tsc --noEmit` and your test suite afterward, since that will catch any file that relied on extensionless imports your bundler was forgiving about.

## Node services and the `dist` question

The bigger win is code that Node runs directly. A `paths` alias in a Node service was always a trap: `tsc` happily type-checks `@/db/client`, emits it unchanged into `dist`, and the first run crashes with `ERR_MODULE_NOT_FOUND`. The usual fix was another tool, like `tsc-alias` or `tsconfig-paths`, to rewrite or patch resolution after the fact.

With subpath imports, Node itself is the resolver. Point the alias at your build output:

```json
{
  "type": "module",
  "imports": {
    "#/*": "./dist/*"
  }
}
```

That is the exact example in the [TypeScript 6.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/). With `rootDir` and `outDir` set explicitly, TypeScript maps the `dist` path back to the matching source file in `src` for type-checking, while Node resolves the emitted JavaScript at runtime. No post-build rewrite step.

If you run TypeScript directly with Node's type stripping and never build, map to source instead and write your imports with the real `.ts` extension. Either way, the alias lives in one file that Node reads.

## The tradeoffs

A few things to know before you commit to it:

- **Version floor.** `#/` needs Node 24.14+ or 25.4+. On Node 22, or anything older, you still need a named prefix like `#src/*`. Pin `engines` in `package.json` so nobody discovers this in CI.
- **Tooling lag.** Every resolver has to implement the `#/` rule. The oxc resolver needed an explicit change for it, and older Jest, ESLint import plugins, or editor extensions may not have caught up. Check yours before a big rename.
- **Private by design.** `imports` only applies inside the package that declares it. In a monorepo, each workspace package gets its own aliases. It will not let `apps/web` reach into `packages/ui/src`, and that's a feature.
- **It's `#`, not `@`.** Some teams will find this ugly for a week. Then it's just the alias.

If your tsconfig still has `baseUrl` and a `paths` block, you have to touch it before TypeScript 7 anyway. That's the moment to move the alias somewhere Node, Vite, Vitest, and TypeScript all agree on. Start with the [Node.js subpath imports docs](https://nodejs.org/api/packages.html#subpath-imports), add one line to `package.json`, and delete three config blocks.
