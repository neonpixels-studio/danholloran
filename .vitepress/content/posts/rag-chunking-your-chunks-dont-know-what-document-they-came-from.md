---
date: "2026-11-20T02:15:53.000-08:00"
tags: ["ai", "rag", "embeddings", "llm", "embeddings-and-chunking-strategy"]
draft: false
title: "RAG Chunking: Your Chunks Don't Know What Document They Came From"
image: "/images/posts/rag-chunking-your-chunks-dont-know-what-document-they-came-from.jpg"
topic: "ai"
description: "Chunk size gets the debate, but most RAG misses come from chunks that lost their context. Split on structure, carry context in, and measure recall."
---

Most RAG tutorials spend one line on chunking: grab a text splitter, set it to 1,000 characters with 200 overlap, move on to the fun part. Then the bot confidently answers a question about your refund policy with a paragraph from the shipping policy, and you start tuning the prompt, swapping embedding models, and raising `topK`. The retrieval step was the problem the whole time, and the retrieval step is mostly decided by how you cut the documents up.

The uncomfortable part is that there is no magic number. What the research does agree on is narrower and more useful: where you split matters, what each chunk carries with it matters more, and the only way to know your settings work is to measure them on your own queries.

## Size and overlap: smaller than you think, and overlap isn't free

Chroma's [Evaluating Chunking](https://research.trychroma.com/evaluating-chunking) report scored strategies at the token level instead of the document level, which is what you actually care about when you stuff chunks into a prompt. With `text-embedding-3-large` and five retrieved chunks, a recursive splitter at 200 tokens with no overlap hit 88.1% recall and 7.0% precision. The same splitter at 800 tokens with 400 overlap got 85.4% recall and 1.5% precision. Bigger chunks did not find more; they just shipped about four times more irrelevant tokens into the context window, which you pay for on every request.

Two other findings from that report are worth stealing. First, the default separators in the popular `RecursiveCharacterTextSplitter` produced lots of tiny fragments, so the authors added sentence punctuation to the separator list to get fair results. Second, overlap helped a weak, small embedding model but did little for a strong one. Overlap is a crutch for boundaries in the wrong place. Fix the boundaries and you can usually drop it.

Treat the numbers as a starting range (roughly 200 to 500 tokens for prose), not a rule. Code and reference tables want bigger chunks so a function or a row group stays whole.

## Split on structure, and carry the headings with you

Your docs already tell you where the boundaries are: headings, list blocks, code fences. A splitter that respects them beats one that counts characters, and it can also attach the heading path to each chunk so "Refunds" and "Shipping" stop looking identical to the embedding model.

```ts
type Chunk = {
  id: string;
  text: string;
  headingPath: string[];
  source: string;
};

export function chunkMarkdown(
  source: string,
  md: string,
  maxChars = 1600,
): Chunk[] {
  const chunks: Chunk[] = [];
  const path: string[] = [];
  let buf: string[] = [];

  const flush = () => {
    const body = buf.join("\n").trim();
    buf = [];
    if (!body) return;
    // Split oversized sections on paragraph breaks, never mid-sentence.
    let part = "";
    for (const para of body.split(/\n{2,}/)) {
      if (part && part.length + para.length > maxChars) {
        push(part);
        part = "";
      }
      part += (part ? "\n\n" : "") + para;
    }
    push(part);
  };

  const push = (text: string) =>
    chunks.push({
      id: `${source}#${chunks.length}`,
      source,
      headingPath: [...path],
      // The prefix is what gets embedded and indexed, not just stored.
      text: `${[source, ...path].join(" > ")}\n\n${text}`,
    });

  for (const line of md.split("\n")) {
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      path.length = h[1].length - 1;
      path.push(h[2].trim());
    } else {
      buf.push(line);
    }
  }
  flush();
  return chunks;
}
```

This ignores fenced code blocks that contain `#` lines, so handle those if your docs have shell snippets. The important line is the one that prepends `source > Section > Subsection` to the embedded text. It costs a few tokens per chunk and turns "The fee is waived after 30 days" into something that knows which fee.

## When headings aren't enough: generate the context

Plenty of content has no useful structure: transcripts, contracts, wiki pages that are one giant section. Anthropic's [Contextual Retrieval](https://www.anthropic.com/research/contextual-retrieval) write-up handles this by asking a cheap model to write 50 to 100 tokens situating each chunk within its full document, then prepending that before embedding and before building the BM25 keyword index. In their evaluation the context alone cut top-20 retrieval failures from 5.7% to 3.7%, adding BM25 brought it to 2.9%, and a reranker on top got it to 1.9%.

Two caveats. Those are the vendor's own numbers, and at least one independent study has reported smaller gains, so verify on your data. And it is one LLM call per chunk at index time, which is only affordable because the full document can sit in a cached prompt prefix while you loop over its chunks. Without [prompt caching](/posts/prompt-caching-your-prompt-prefix-is-a-cache-key), you are paying for the whole document once per chunk.

## Measure recall before you touch anything

Every number above came from someone else's corpus. Before changing chunk size, write twenty or thirty real questions, mark which source passages answer them, and check whether those passages show up in the top results:

```ts
const hit = (q: EvalCase, results: Chunk[]) =>
  results.some(
    (c) =>
      q.expectedSources.includes(c.source) && c.text.includes(q.mustContain),
  );

const recall =
  cases.filter((q) => hit(q, retrieve(q.question, 5))).length / cases.length;
```

It is the same idea as [starting evals with thirty test cases](/posts/llm-evals-start-as-thirty-test-cases-not-a-platform): small, boring, and the only thing that tells you whether a change helped. Re-chunking a corpus means re-embedding all of it, so run the eval first and change one variable at a time. Most teams find the biggest win is not a new chunk size at all. It is giving each chunk enough context to be found.
