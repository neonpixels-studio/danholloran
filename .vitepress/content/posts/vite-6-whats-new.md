---
created_at: '2025-12-13T11:48:00.000-08:00'
tags: ['tooling', 'javascript', 'bundlers']
draft: true
title: "Vite 6: What's New and Why the Environment API Changes Everything"
image: '/images/posts/vite-6-whats-new.jpg'
topic: 'development'
description: "Vite 6 arrived in late 2024 with the new Environment API at its core. Here's what changed, what it means for framework authors, and what you need to update in your projects."
---

Vite 6 dropped in November 2024 and has been described by the core team as the most significant major release since Vite 2. The headline feature is the Environment API — a low-level abstraction that unlocks more accurate SSR dev experiences — but there's plenty more worth knowing before you upgrade.

## The Environment API

Vite has always supported SSR, but the dev server and the production build had fundamentally different models. In development, Vite ran everything through the browser-targeting pipeline and approximated the server environment. This meant framework authors had to work around assumptions baked into Vite's module graph.

The Environment API fixes this by letting you configure multiple distinct environments — each with its own module resolution strategy, transforms, and runtime target:

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  environments: {
    client: {
      // Browser bundle — existing behavior
    },
    ssr: {
      resolve: {
        conditions: ['node', 'require'],
      },
    },
    edge: {
      resolve: {
        conditions: ['workerd', 'worker'],
      },
    },
  },
});
```

For most app developers, this is invisible — your `npm run dev` still just works. But for framework authors (Nuxt, Remix, SolidStart, etc.) the API makes it possible to run SSR code in a runtime-accurate environment during development, closing the gap between dev and prod.

## No More Node.js 18 Support

Vite 6 drops Node.js 18 (which reached end-of-life in April 2025) and requires Node.js 20.0.0 or later. If you're still on Node 18, this is your migration forcing function. Node 20 is the current LTS and 22 is the active release, so this is a reasonable floor:

```bash
# Check your current Node version
node --version

# Update via nvm
nvm install 20
nvm use 20
```

## Opt-in `this.environment` in Plugins

Plugin authors gain access to the current environment context inside hooks. This lets a single plugin behave differently based on whether it's processing code for the browser, SSR, or an edge runtime:

```ts
const myPlugin = {
  name: 'my-plugin',
  transform(code, id) {
    if (this.environment.name === 'ssr') {
      // SSR-specific transform
      return transformForSSR(code);
    }
    return code;
  },
};
```

For end users this means ecosystem plugins can be smarter about what they do without requiring separate browser and SSR variants.

## Performance: 17 Million Weekly Downloads

Beyond the API changes, Vite 6 reflects how dominant Vite has become in the ecosystem. npm downloads jumped from 7.5 million per week (Vite 5 launch) to 17 million per week. The performance investments in the build pipeline reflect this scale — incremental rebuilds, chunk splitting heuristics, and cold-start times have all been tuned.

## Upgrading

For most SPAs, the upgrade is mechanical:

```bash
npm install vite@6 --save-dev
```

The team maintained backward compatibility for non-SSR apps. If you use SSR, check the migration guide for the handful of `server.ssrLoadModule` changes. Framework users (Next.js, Nuxt, etc.) should wait for their framework to declare Vite 6 support before upgrading.

Vite 6 cements the project's position as the default build tool for new frontend projects. The Environment API is the kind of foundational investment that pays dividends over the next several major releases.
