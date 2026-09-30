---
date: "2026-09-28T02:15:18.000-07:00"
tags: ["node.js", "node", "typescript", "tooling"]
draft: false
title: "Node.js Type Stripping: Run TypeScript Without a Build Step"
image: "/images/posts/nodejs-type-stripping-run-typescript-without-a-build-step.jpg"
topic: "development"
description: "Node.js now runs .ts files out of the box by erasing types, not compiling them. Here's what that buys you, what it refuses to do, and the tsconfig that keeps you honest."
---

Every Node project written in TypeScript used to carry the same small tax. You wanted to run a one-off script, so you reached for `ts-node`, then fought its ESM loader, then switched to `tsx`, then added a `build` step so production wouldn't depend on either. None of that was hard. It was just friction, repeated in every repo.

That tax is mostly gone. Type stripping has been on by default since Node 23.6 and 22.18, and as of Node 25.2 and 24.12 the docs mark it **Stable**. You can type `node script.ts` and it runs. The catch is that "Node runs TypeScript" is a slightly misleading headline. Node doesn't compile TypeScript. It erases it, and knowing the difference is what keeps you from hitting confusing runtime errors.

## Erasing, not compiling

When Node loads a `.ts`, `.mts`, or `.cts` file, it hands the source to a small SWC-based module called amaro. Amaro finds the type annotations, interfaces, and type aliases and replaces them with whitespace. What's left is plain JavaScript with the exact same line and column positions, so stack traces point at the right place without source maps.

```ts
// greet.ts
interface User {
  name: string;
  visits: number;
}

export function greet(user: User): string {
  return `Welcome back, ${user.name} (${user.visits} visits)`;
}
```

```bash
node greet.ts
```

Two things this does **not** do. It doesn't type check: a file full of type errors runs fine as long as the JavaScript underneath is valid. And it doesn't read `tsconfig.json` at all, so `paths`, `target` downleveling, and every other compiler setting are ignored. Your editor and `tsc --noEmit` in CI are still where type safety lives. Node just stopped making you transpile before you can execute.

## The syntax that breaks

Because Node only deletes code, anything in TypeScript that _generates_ JavaScript can't work. The big four are `enum` declarations, `namespace` blocks with runtime values, constructor parameter properties, and import aliases like `import Alias = Some.Namespace`. Hit one and Node throws `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`.

```ts
// Fails: parameter properties generate assignments
class Repo {
  constructor(private db: Database) {}
}

// Works: the same thing, written as erasable syntax
class Repo {
  private db: Database;
  constructor(db: Database) {
    this.db = db;
  }
}
```

Enums are the one most teams trip over. A `const` object with `as const` gives you the same autocomplete and a real runtime value:

```ts
export const Status = {
  Draft: "draft",
  Published: "published",
} as const;

export type Status = (typeof Status)[keyof typeof Status];
```

There used to be an escape hatch, `--experimental-transform-types`, that handled enums and friends. Node 26 removed it. If you need full TypeScript semantics at runtime, the docs now point you to a third-party loader like `tsx`. For everything else, write erasable TypeScript.

Decorators and `.tsx` files are also out. Decorators wait on native JavaScript support, and JSX needs a real transform.

## Let the compiler enforce it for you

You don't have to memorize that list. TypeScript 5.8 added `erasableSyntaxOnly`, which turns every non-erasable construct into a compile error. The Node docs recommend this setup:

```json
{
  "compilerOptions": {
    "noEmit": true,
    "target": "esnext",
    "module": "nodenext",
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true
  }
}
```

`verbatimModuleSyntax` matters more than it looks. Node can only strip a type import it can recognize, so you must write `import type { User } from './user.ts'` or `import { greet, type User } from './greet.ts'`. A plain `import { User }` is treated as a value import and fails at runtime because nothing named `User` exists in the emitted JavaScript. This flag makes `tsc` catch that before Node does.

Two more habits follow from "Node treats `.ts` like `.js`." Import specifiers need the real extension (`./db.ts`, not `./db`), and module format follows the nearest `package.json` `"type"` field, just like JavaScript. `rewriteRelativeImportExtensions` lets you keep writing `.ts` specifiers and still emit working `.js` if you later publish compiled output.

If you relied on `tsconfig` `paths` for aliases like `@/lib/db`, switch to Node's own subpath imports. They're defined in `package.json` and must start with `#`:

```json
{
  "type": "module",
  "imports": {
    "#lib/*": "./src/lib/*"
  }
}
```

```ts
import { connect } from "#lib/db.ts";
```

## Where it fits, and where it doesn't

Type stripping shines for scripts, CLIs, internal services, and test files. Pair it with the built-in test runner and a small project can drop `ts-node`, `tsx`, and a build step entirely.

It's not for publishing libraries. Node deliberately refuses to strip types from anything under `node_modules`, so packages still need to ship compiled JavaScript and `.d.ts` files. And if your codebase leans on enums, decorators, or JSX on the server, a full transpiler remains the right tool.

The practical move this week: add `erasableSyntaxOnly` to an existing project and see what lights up. If the list is short, you're a few small refactors away from deleting a dependency and a build step. The [Node.js TypeScript docs](https://nodejs.org/api/typescript.html) cover the remaining edge cases.
