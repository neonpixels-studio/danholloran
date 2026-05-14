---
created_at: '2026-04-18T10:44:00.000-08:00'
tags: ['javascript', 'performance', 'web-apis', 'tooling']
draft: true
title: "Progressive Web Apps in 2026: Offline-First Patterns That Actually Work"
image: '/images/posts/progressive-web-apps-in-2026-offline-first-patterns.jpg'
topic: 'development'
description: "PWAs have matured significantly. Between Workbox's caching strategies, the Background Sync API, and the Web App Manifest improvements, building offline-capable apps is more practical than ever."
---

The PWA narrative has had its ups and downs. Early enthusiasm collided with iOS limitations and uneven browser support. But the gap has closed considerably — iOS now supports service workers, push notifications, and installation prompts with reasonable fidelity. Combined with modern tooling like Workbox and Vite's PWA plugin, building an offline-capable web app is no longer a heroic effort.

## The Service Worker Is Still the Core

A service worker is a JavaScript file that runs in the background, independent of the page. It intercepts network requests, manages caches, and enables offline functionality. The installation lifecycle:

```js
// sw.js — your service worker
const CACHE_NAME = 'app-v1';
const PRECACHE_URLS = ['/', '/index.html', '/app.css', '/app.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});
```

Writing this by hand is tedious and error-prone. That's where Workbox comes in.

## Workbox Caching Strategies

Workbox provides tested, composable caching strategies that cover the most common patterns:

```js
// sw.js with Workbox
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// Static assets: serve from cache, update in background
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// API responses: try network first, fall back to cache
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    networkTimeoutSeconds: 3,
  })
);

// App shell: serve from cache, revalidate in background
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({ cacheName: 'pages' })
);
```

## Vite PWA Plugin: Zero-Boilerplate Setup

The `vite-plugin-pwa` package generates your service worker, web app manifest, and precache manifest from your Vite config. It's the fastest path to a production-ready PWA:

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      manifest: {
        name: 'My App',
        short_name: 'MyApp',
        theme_color: '#ffffff',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

## Background Sync for Deferred Mutations

The Background Sync API queues failed requests and retries them when connectivity returns — essential for apps where users might submit forms while offline:

```js
// In your service worker
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

const bgSync = new BackgroundSyncPlugin('mutations-queue', {
  maxRetentionTime: 24 * 60, // 24 hours in minutes
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/submit'),
  new NetworkOnly({ plugins: [bgSync] }),
  'POST'
);
```

Form submissions that fail due to offline conditions are stored in IndexedDB and retried automatically when the browser detects connectivity. The user gets instant feedback, and the data eventually makes it to the server.

PWAs aren't replacing native apps for camera-heavy or hardware-dependent experiences, but for content apps, productivity tools, and e-commerce, the gap in capability is now small enough to make the web's distribution advantages decisive.
