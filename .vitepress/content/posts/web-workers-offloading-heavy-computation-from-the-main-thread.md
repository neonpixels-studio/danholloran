---
created_at: "2026-03-07T14:02:00.000-08:00"
tags: ["javascript", "performance", "web-apis"]
draft: false
title: "Web Workers: Keeping Your UI Smooth When the Work Gets Heavy"
image: "/images/posts/web-workers-offloading-heavy-computation-from-the-main-thread.jpg"
topic: "development"
description: "JavaScript is single-threaded, but that doesn't mean your UI has to freeze during heavy computation. Web Workers give you real parallel execution — here's how to use them well."
---

The most common reason a web app freezes during user interaction isn't a network request — it's a long-running synchronous task blocking the main thread. Parsing a large CSV, running a search across thousands of records, processing an image — these can lock up your UI for hundreds of milliseconds. Web Workers solve this cleanly, and with Vite's built-in worker support, the ergonomics have never been better.

## The Core Problem

JavaScript runs on a single thread. When you block that thread — even briefly — the browser can't handle scroll events, clicks, or animations. The classic symptom is a "janky" UI that freezes for a moment while data processes:

```js
// This will block the UI for however long it takes
function processLargeDataset(records) {
  return records.filter(isValid).map(transform).reduce(aggregate, {});
}

// Called on the main thread — bad for large datasets
const result = processLargeDataset(tenThousandRecords);
```

## Moving Work into a Worker

A Web Worker runs in a separate thread with its own event loop. Communication happens via `postMessage` and the `message` event:

```js
// worker.js — runs in its own thread
self.onmessage = function ({ data }) {
  const result = processLargeDataset(data.records);
  self.postMessage({ result });
};

function processLargeDataset(records) {
  return records.filter(isValid).map(transform).reduce(aggregate, {});
}
```

```js
// main.js — runs on the main thread
const worker = new Worker("./worker.js");

worker.postMessage({ records: tenThousandRecords });

worker.onmessage = function ({ data }) {
  updateUI(data.result); // Main thread is free while worker runs
};
```

The UI stays responsive while the worker crunches through the data, and the result comes back when it's ready.

## Vite Makes Workers Ergonomic

In a Vite project, you get module workers with proper TypeScript support using the `?worker` import syntax:

```ts
// src/workers/csv-parser.worker.ts
import Papa from "papaparse";

self.onmessage = ({ data: { csvText } }: MessageEvent<{ csvText: string }>) => {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  self.postMessage(result.data);
};
```

```ts
// src/components/CsvUploader.vue (or any component)
import CsvParserWorker from "@/workers/csv-parser.worker.ts?worker";

const worker = new CsvParserWorker();

function handleFile(file: File) {
  file.text().then((text) => {
    worker.postMessage({ csvText: text });
  });
}

worker.onmessage = ({ data }: MessageEvent) => {
  rows.value = data;
};
```

Vite handles bundling the worker as a separate chunk. No separate `webpack.config` for workers, no manual `new URL()` gymnastics.

## Wrapping Workers with Comlink

The `postMessage` API gets verbose for complex interactions. Comlink from Google Chrome Labs lets you expose a class from a worker and call it as if it were a regular async function:

```ts
// worker.ts
import { expose } from "comlink";

const api = {
  async searchRecords(query: string, records: Record[]) {
    return records.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(query)),
    );
  },
  async sortByField(field: string, records: Record[]) {
    return [...records].sort((a, b) =>
      String(a[field]).localeCompare(String(b[field])),
    );
  },
};

expose(api);
```

```ts
// main.ts
import { wrap } from "comlink";
import DataWorker from "./worker?worker";

const worker = wrap<typeof api>(new DataWorker());

// Feels like a regular async function call
const results = await worker.searchRecords("react", allPosts);
```

Comlink handles the message passing and serialization automatically. The worker feels like a local async module, and TypeScript infers the return types correctly.

Web Workers aren't exotic — they're the correct tool for any computation that would otherwise block user interaction. With Vite and Comlink, the barrier to using them is lower than ever.
