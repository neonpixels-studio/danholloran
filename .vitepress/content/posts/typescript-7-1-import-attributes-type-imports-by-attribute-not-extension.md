---
date: "2026-11-26T02:15:51.000-08:00"
tags: ["typescript", "tooling", "javascript", "bundlers"]
draft: false
title: "TypeScript 7.1 Import Attributes: Type Imports by Attribute, Not Extension"
image: "/images/posts/typescript-7-1-import-attributes-type-imports-by-attribute-not-extension.jpg"
topic: "development"
description: "TypeScript 7.1 lets ambient modules match on import attributes, so CSS, text, and bytes imports get the right type and a missing with clause is an error."
---

Every project that imports something other than JavaScript ends up with a `globals.d.ts` full of wildcard module declarations. `*.css`, `*.svg`, `*.md`, `*.txt`, one block per extension, each one promising TypeScript that a file name pattern tells you what the import returns.

That promise was always a little shaky, and import attributes break it outright. With `import sheet from "./theme.css" with { type: "css" }`, the runtime decides what you get based on the `with` clause, not the `.css` on the end. Leave the attribute off and a bundler might hand you a CSS Modules class map instead of a `CSSStyleSheet`. Your types say one thing, your runtime does another, and nothing complains. TypeScript 7.1, currently in beta, finally lets you type imports by attribute instead of by extension.

## The problem with extension-based declarations

Here is the pattern most of us have written at some point:

```ts
// globals.d.ts
declare module "*.css" {
  const sheet: CSSStyleSheet;
  export default sheet;
}

declare module "*.md" {
  const content: string;
  export default content;
}

declare module "*.txt" {
  const content: string;
  export default content;
}
```

Three issues hide in there. First, it repeats itself: `.md` and `.txt` both come back as strings for the same reason, but you declare them separately. Second, it can't catch a missing attribute. This type-checks fine:

```ts
import readme from "../README.md"; // forgot `with { type: "text" }`
```

Third, and worst, the same extension can legitimately mean two different things. A bundler's default for `.css` is often CSS Modules, while `with { type: "css" }` asks for the browser-native `CSSStyleSheet`. One wildcard declaration can only describe one of those, so at least one import in your codebase is typed wrong.

## Declaring modules by attribute

TypeScript 7.1 adds import attributes to ambient module declarations. You match on `"*"` and let the attribute carry the meaning:

```ts
// import-attributes.d.ts (no top-level imports, so it stays global)
declare module '*' with { type: 'css' } {
  const sheet: CSSStyleSheet
  export default sheet
}

declare module '*' with { type: 'text' } {
  const content: string
  export default content
}

declare module '*' with { type: 'bytes' } {
  const content: Uint8Array
  export default content
}
```

Now the type follows the attribute, which is exactly what the runtime does:

```ts
import theme from "./themes/neon.css" with { type: "css" };
import readme from "../README.md" with { type: "text" };
import icon from "./icon.png" with { type: "bytes" };

document.adoptedStyleSheets.push(theme); // theme: CSSStyleSheet
console.log(readme.length); // readme: string
console.log(icon.byteLength); // icon: Uint8Array
```

And if you leave the attribute off, the import no longer matches these declarations, so TypeScript reports an error instead of quietly guessing. A single `type: 'text'` block also covers `.md`, `.txt`, `.sql`, `.graphql`, or anything else you want as a string, so the per-extension list goes away.

To try it today:

```bash
npm install -D typescript@beta
```

## What this doesn't do

This is a typing feature, and it's worth being clear about the edges before you rip out your old declarations.

**It doesn't check the file exists.** Like every ambient module declaration, a match means TypeScript trusts you. A typo in the path surfaces at runtime or in your bundler's build, not in `tsc`.

**It doesn't make your runtime support the attribute.** The syntax for import attributes is standardized, and `type: 'json'` is widely supported. The values beyond that are not equal. `type: 'css'` works in browsers that support CSS module scripts, so check your support matrix. `type: 'text'` and `type: 'bytes'` are still TC39 proposals: the text proposal is at Stage 2 and bytes is at Stage 2.7 as of their 2026 drafts. Bun and Deno have shipped versions of text and bytes imports, while Vite has no native support yet and still leans on its own `?raw` query. Declaring `type: 'bytes'` in a project whose bundler doesn't understand it just moves the failure from your editor to your build.

**Libraries shouldn't ship these declarations.** The TypeScript team explicitly recommends that published packages leave them out and that each app declare its own. That keeps you in control of whether `CSSStyleSheet` comes from `lib.dom.d.ts` and avoids collisions if TypeScript adds built-in declarations later. Treat the file above as app-level config, the same as your `tsconfig.json`.

A sensible migration is to keep your extension-based declarations for anything your bundler handles by convention (CSS Modules, SVG-as-component plugins), and move only the imports that actually use `with { ... }` to attribute-based declarations. Mixing the two is fine; they describe different contracts.

## The takeaway

Import attributes moved the "what is this import?" decision out of the file name and into the import statement. TypeScript 7.1 catches the type system up to that change: you describe the contract once per attribute, missing attributes become errors, and a `.css` file imported two different ways can finally have two different types. It's a small feature, but it closes a gap that `globals.d.ts` files have been papering over for years. Read the [TypeScript 7.1 beta announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/) for the full details, and check the [import text](https://tc39.es/proposal-import-text/) and [import bytes](https://tc39.es/proposal-import-bytes/) proposals before you lean on those two in production.
