---
date: "2026-11-27T02:15:59.000-08:00"
tags: ["ai", "llm", "multimodal", "typescript"]
draft: false
title: "Sending PDFs to an LLM: Every Page Is Text and an Image, and You Pay for Both"
image: "/images/posts/sending-pdfs-to-an-llm-every-page-is-text-and-an-image.jpg"
topic: "ai"
description: "PDF input sends each page as extracted text plus a rendered image. Here's how to measure that cost and when to send plain text instead."
---

Dropping a PDF into an LLM request feels like the easy path. No parsing library, no OCR pipeline, no fighting with tables that come out of `pdftotext` as word soup. You base64 the file, add a question, and the model reads it, charts included.

Then the invoice arrives, or a 300-page contract trips a request limit, and you find out what the API was doing with that file. With Anthropic's Messages API, a PDF is not one input. Every page is sent to the model twice: once as extracted text and once as a rendered image. You pay for both, on every request that includes the file.

## What actually happens to a PDF

Per [Anthropic's PDF support docs](https://platform.claude.com/docs/en/build-with-claude/pdf-support), the API converts each page into an image, extracts that page's text, and gives the model both. That is why it can answer questions about a bar chart that has no text layer at all. It is also why the cost has two parts:

- **Text:** typically 1,500 to 3,000 tokens per page, depending on how dense the page is.
- **Image:** each page image is capped at 1,568 visual tokens, because page renders are fit into the standard resolution tier.

The request shape is simple, which is part of why the cost is easy to miss:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";

const anthropic = new Anthropic();
const pdfBase64 = await readFile("./q3-report.pdf", { encoding: "base64" });

const response = await anthropic.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: pdfBase64,
          },
        },
        { type: "text", text: "Summarize the revenue changes in this report." },
      ],
    },
  ],
});
```

Run the numbers for a 40-page, text-heavy report. At around 2,000 text tokens plus up to 1,568 image tokens a page, that is roughly 140,000 input tokens per call. Send the extracted text alone and you are closer to 80,000. If the question is "summarize the revenue section," the page images bought you nothing.

The other ceiling is volume. A request can carry 600 pages, or 100 when the request's context window is under 1M tokens, and dense pages can fill the context window well before that page count. Splitting large documents is not an edge case; plan for it.

## Measure before you guess

Don't estimate from page counts. The [token counting endpoint](https://platform.claude.com/docs/en/build-with-claude/token-counting) is free, accepts the same content blocks as `messages.create`, and supports base64 PDFs (not `url` or `file` sources). Count once with the PDF and once with plain extracted text, and the gap tells you what the page images cost for your documents:

```ts
const asPdf = await anthropic.messages.countTokens({
  model: "claude-opus-5-5",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: pdfBase64,
          },
        },
        { type: "text", text: "Summarize the revenue changes in this report." },
      ],
    },
  ],
});

console.log(asPdf.input_tokens);
```

Count against the model you will actually call. Claude Opus 4.7 and later use a newer tokenizer that produces roughly 30 percent more tokens for the same text, so a count taken on an older model will undershoot.

## Route by what the question needs

The fix is not "never send PDFs." It's deciding per document, and per question, whether the visual layer matters.

- **Text-first documents** (contracts, policies, prose reports with a text layer): extract the text yourself and send it as a text block. Cheaper, faster, and you can chunk or cache it however you like.
- **Visual documents** (scanned pages, charts, forms where layout carries meaning): send the PDF. This is what the image half of the bill is for.
- **Mixed documents:** send text for most pages and only the pages with figures as a PDF, or as images.

A simple router checks whether the PDF has a usable text layer:

```ts
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

async function extractText(buffer: Buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
    );
  }
  return pages;
}

const pages = await extractText(await readFile("./q3-report.pdf"));
const avgChars = pages.join("").length / pages.length;
const needsVision = avgChars < 200; // near-empty text layer: likely scanned
```

The threshold is a heuristic, not a rule. Tune it on your own documents, and override it when the user's question is about a chart.

Standalone images follow the same logic. Claude counts image cost in 28×28-pixel patches, so an image costs `⌈width / 28⌉ × ⌈height / 28⌉` visual tokens. On Claude 4.7 and later, the [high-resolution tier](https://platform.claude.com/docs/en/build-with-claude/vision) allows up to 2,576 px on the long edge and 4,784 tokens, about three times the standard tier. A 4K screenshot sent unresized gets downscaled to fit, and it costs the full 4,784 tokens. If you don't need that fidelity, resize before you send:

```ts
import sharp from "sharp";

const resized = await sharp(screenshot)
  .resize({
    width: 1568,
    height: 1568,
    fit: "inside",
    withoutEnlargement: true,
  })
  .jpeg({ quality: 85 })
  .toBuffer();
```

Watch the compression level. Heavy JPEG artifacts can make small text unreadable, and then you've saved tokens on an answer that's wrong.

## The takeaway

Multimodal input is a capability, not a default. When you send a PDF, you're paying for the model to see each page as well as read it. That's worth it for scans, charts, and forms, and wasted on a contract you could have sent as text. Count tokens on a few real documents, route by what the question needs, and cache any document you query more than once. The [PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support) and [vision](https://platform.claude.com/docs/en/build-with-claude/vision) docs list the current limits, and they change often enough that you should check them again before you hard-code anything.
