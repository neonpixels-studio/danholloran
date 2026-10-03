---
date: "2026-10-01T02:15:17.000-07:00"
tags: ["typescript", "tooling", "bundlers", "node"]
draft: false
title: "Your tsconfig Is Still Written for TypeScript 5. Here's the Cleanup TS 7 Forces"
image: "/images/posts/your-tsconfig-is-still-written-for-typescript-5.jpg"
topic: "development"
description: "TypeScript 6 flipped half a dozen compiler defaults and TypeScript 7 deleted the options it deprecated. Here's the tsconfig audit that gets you onto the native compiler without a wall of red."
---

Most `tsconfig.json` files are archaeology. Somebody copied one from a starter repo in 2021, somebody else added `baseUrl` so the `@/` imports would work, and a third person set `moduleResolution: "node"` because a Stack Overflow answer said so. Nobody has touched it since, because it worked.

That stops being true this year. TypeScript 6.0 (March 2026) was a deliberate bridge release: it changed a batch of defaults and deprecated a list of legacy options. TypeScript 7.0, the Go-native compiler that went GA in July, keeps the new defaults and **removes** the deprecated options outright. If you upgraded to 6.0 and silenced the warnings with `"ignoreDeprecations": "6.0"`, you didn't fix anything. You scheduled the breakage for your TS 7 upgrade.

Here's the audit, in the order it will actually bite you.

## The two changes with confusing error messages

The TypeScript team called these out up front because the errors they produce don't point at the cause.

**`types` now defaults to `[]`.** Previously, TypeScript loaded every package under `node_modules/@types` into the global scope. That's how `process`, `describe`, and `it` showed up without an import. In 6.0 and later, nothing is loaded unless you list it. The symptom is a flood of `Cannot find name 'process'` or `Cannot find name 'describe'` errors that look like a broken install.

```json
{
  "compilerOptions": {
    "types": ["node", "vitest/globals"]
  }
}
```

You can restore the old behavior with `"types": ["*"]`, but don't. The team reports that many projects saw 20 to 50 percent faster builds just from listing the types they actually use, because a typical monorepo transitively drags in hundreds of `@types` packages nobody imports.

**`rootDir` now defaults to the tsconfig's directory.** It used to be inferred from the common ancestor of your source files. If your sources live in `src/` and you never set `rootDir`, your output silently moves from `dist/index.js` to `dist/src/index.js`. Nothing errors. Your `package.json` `main` field just points at a file that no longer exists.

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["./src"]
}
```

If you use a bundler and `noEmit`, this one won't affect you. If you publish a library with `tsc`, check it first.

## The defaults that flipped quietly

These changed in 6.0 and are the baseline in 7.0:

- `strict` is now `true`. If you were relying on the old `false` default, you'll suddenly get every `strictNullChecks` and `noImplicitAny` error at once.
- `module` defaults to `esnext`, and `target` floats to the newest supported spec (currently `es2025`).
- `noUncheckedSideEffectImports` is `true`, so a typo in `import './polyfil'` is now an error instead of a silent no-op.

The honest move with `strict` is to set it explicitly either way. If your codebase isn't ready, write `"strict": false` so the decision is visible in the file rather than inherited from a default that changed under you. Then turn on the individual checks one at a time.

## The options that are gone in 7.0

These were deprecated in 6.0 and do not exist in 7.0:

| Option                                                          | Replace with                                             |
| --------------------------------------------------------------- | -------------------------------------------------------- |
| `moduleResolution: "node"` / `"node10"`                         | `"nodenext"` for Node, `"bundler"` for Vite/webpack/Bun  |
| `moduleResolution: "classic"`                                   | `"bundler"` or `"nodenext"`                              |
| `baseUrl`                                                       | explicit prefixes in `paths`                             |
| `target: "es5"`, `downlevelIteration`                           | `es2015` or later; let your bundler handle older targets |
| `module: "amd"`, `"umd"`, `"system"`, `outFile`                 | a bundler                                                |
| `esModuleInterop: false`, `allowSyntheticDefaultImports: false` | delete them; both are always on                          |

`baseUrl` is the one most frontend projects hit. Almost everyone used it as a prefix for `paths`, but it was also a lookup root, which meant TypeScript would happily resolve `import x from "utils"` to `src/utils.ts` even though no bundler would. The fix is mechanical:

```diff
  {
    "compilerOptions": {
-     "baseUrl": "./src",
      "paths": {
-       "@/*": ["*"]
+       "@/*": ["./src/*"]
      }
    }
  }
```

One related improvement: 6.0 now allows `moduleResolution: "bundler"` together with `module: "commonjs"`, which is the cleanest landing spot for older projects that still emit CommonJS but used `node10` resolution.

## Doing the migration without guessing

Run your current version with the deprecation warnings visible first. Remove `ignoreDeprecations` if you added it, run `tsc --noEmit`, and treat every warning as a ticket. For `baseUrl` and `rootDir`, the TypeScript team's experimental [`ts5to6`](https://github.com/andrewbranch/ts5to6) codemod will rewrite the config across a monorepo for you.

Once 6.0 is clean, 7.0 should be uneventful for the config side. If you still see odd inference differences, 6.0's `--stableTypeOrdering` flag makes the JS compiler order types the way the Go compiler does, so you can shake those out before switching binaries.

A tsconfig is supposed to describe what your project actually does. After this cleanup, it finally will: explicit `types`, explicit `rootDir`, a `moduleResolution` that matches your real runtime, and no lookup roots that resolve imports your bundler never could. The full list of changes is in the [TypeScript 6.0 release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/), and it's worth one careful read before you bump the version in `package.json`.
