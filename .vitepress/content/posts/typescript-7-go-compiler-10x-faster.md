---
date: '2026-05-16T09:02:57.000+00:00'
tags: ['typescript', 'tooling', 'javascript']
draft: true
title: "TypeScript 7.0: The Go Compiler That Makes TS 10x Faster"
image: '/images/posts/typescript-7-go-compiler-10x-faster.jpg'
topic: 'development'
description: "TypeScript 7.0 rewrites the compiler in Go, cutting build times by up to 10x. Here's what changed, what it means for your projects, and how to try it right now."
---

If you've worked on a large TypeScript codebase, you know the pain. You hit save, you wait. The type-checker grinds through hundreds of files, your IDE lag spikes, and CI takes minutes just to get through `tsc --noEmit`. It's not TypeScript's fault — the language has always made a reasonable trade-off between expressiveness and performance. But that trade-off is about to get renegotiated.

TypeScript 7.0 is currently in beta, and the headlining change is a complete rewrite of the compiler — from TypeScript itself to Go. The result is build times that are roughly 10x faster. Not 10% faster. Ten times.

## Why Go, and Why Now

The TypeScript team's choice of Go wasn't about hype — it was about constraints. The existing compiler is JavaScript running on Node.js, which means it inherits V8's garbage collector and single-threaded execution model. That's fine for small projects, but as codebases scale to hundreds of thousands of lines, GC pauses and sequential file processing become the bottleneck.

Go hits a practical sweet spot: it compiles to native binaries (eliminating Node.js startup overhead), its goroutines make parallelizing across files straightforward, and its memory model is substantially more predictable than V8's heap. In benchmarks using the VS Code codebase — 1.5 million lines of TypeScript — the difference is stark:

```
tsc (current):    ~78 seconds
tsgo (TS 7 beta):  ~7.5 seconds
```

Memory consumption also drops by around 57%. If you run type-checking in CI on every PR, that's real money and real developer-hours back on the table.

## Trying It Today

TypeScript 7.0 is still in beta, but it's stable enough for experimentation and, for many projects, everyday use. The beta ships under the `@typescript/native-preview` package:

```bash
# Local dev dependency
npm install -D @typescript/native-preview

# Or globally
npm install -g @typescript/native-preview
```

Once installed, you get a `tsgo` executable that works as a drop-in for `tsc`:

```bash
# Type-check your project
tsgo --noEmit

# Watch mode
tsgo --watch

# Check the version
tsgo --version
# Version 7.0.0-beta
```

VS Code users can also install the **TypeScript Native Preview** extension to get the faster language server in the editor. The experience is noticeably snappier even on mid-sized codebases — hover types and go-to-definition feel instant compared to the current server.

## What's Different (and What Might Break)

For the vast majority of projects, `tsgo` is a transparent swap for `tsc`. As of the beta, the Go compiler passes over 95% of the TypeScript test suite. The remaining gaps are mostly around legacy emit modes and decorator metadata, which modern projects typically don't rely on.

There are two notable changes to be aware of:

**Strict mode is now the default.** TypeScript 7 enables `strict: true` out of the box, which bundles `strictNullChecks`, `noImplicitAny`, and friends. If your `tsconfig.json` currently omits strict settings, you may see new errors in the beta. The fix is explicit:

```json
{
  "compilerOptions": {
    "strict": false
  }
}
```

That said, if you've been meaning to tighten up your config, this is a good forcing function.

**Some tooling APIs aren't compatible yet.** The compiler exposes a different internal API surface (codenamed Strada). Third-party tools that reach into TypeScript's compiler internals — some linters, formatters, or custom language service plugins — may not work with `tsgo` until they're updated. Check your dependencies before switching production CI over. For most teams using `tsc` directly or through tools like `ts-jest` and `tsx`, the transition should be smooth.

## What This Means Going Forward

TypeScript 7 isn't adding a sweeping new type system feature — it's investing in the foundation. Faster type-checking compounds in every direction: tighter feedback loops in the editor, faster CI pipelines, and more room for the language to add richer checks without hitting practical performance walls.

The stable release is expected by late June or early July 2026. Until then, the beta is worth running on a branch or a greenfield project to get a feel for the speedups. You can follow along at the [TypeScript blog](https://devblogs.microsoft.com/typescript/) and file issues on the [typescript-go GitHub repo](https://github.com/microsoft/typescript-go).
