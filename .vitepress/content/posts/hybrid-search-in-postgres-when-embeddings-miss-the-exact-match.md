---
date: "2026-11-28T02:15:33.000-08:00"
tags: ["ai", "rag", "embeddings", "typescript", "hybrid-search"]
draft: false
title: "Hybrid Search in Postgres: When Embeddings Miss the Exact Match"
image: "/images/posts/hybrid-search-in-postgres-when-embeddings-miss-the-exact-match.jpg"
topic: "ai"
description: "Vector search misses error codes, SKUs, and names. Combine Postgres full-text search with pgvector using reciprocal rank fusion in one SQL function."
---

You ship a RAG feature, it demos beautifully, and then a user pastes `ERR_SSL_PROTOCOL_ERROR` into the search box. The top result is a vaguely related page about TLS certificates. The page that literally contains that error string is ranked eleventh. Nothing is broken. Embeddings are doing exactly what they were built to do: matching _meaning_. An error code, a SKU, a function name, or a person's surname has very little meaning to match on.

The fix most teams reach for is a second database or a reranking service. Before you do that, know that Postgres can run both kinds of search and merge them in a single query.

## Two searches, two blind spots

Keyword search and semantic search fail in opposite directions.

- **Full-text search** (Postgres `tsvector`) is great at exact tokens. Search "invoice 4471" and it finds the document with "invoice 4471" in it. It is bad at synonyms: "cancel my plan" won't find a doc titled "Ending your subscription."
- **Vector search** (pgvector) is great at paraphrase. It finds "Ending your subscription" for "cancel my plan." It is unreliable on rare literal strings, because those tokens barely move an embedding.

Hybrid search runs both and fuses the results. The tricky part is the fusion. A `ts_rank_cd` score and a cosine distance are on completely different scales, so you can't add them up. Reciprocal rank fusion (RRF) sidesteps that by ignoring the scores and using only each document's **position** in each list:

```text
score(doc) = Σ  1 / (k + rank_in_list)
```

A document ranked 1st in keyword search and 4th in vector search scores `1/(k+1) + 1/(k+4)`. A document found by only one search gets nothing from the other. `k` is a smoothing constant that keeps a single #1 ranking from swamping everything else. The original RRF paper used 60. Supabase's reference implementation defaults to 50. Either is a sane start.

## The schema and the function

This follows the pattern in [Supabase's hybrid search guide](https://supabase.com/docs/guides/ai/hybrid-search), adjusted to use cosine distance. It runs on any Postgres with the `vector` extension.

```sql
create extension if not exists vector;

create table documents (
  id bigint primary key generated always as identity,
  content text not null,
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  embedding vector(512)
);

create index on documents using gin (fts);
create index on documents using hnsw (embedding vector_cosine_ops);
```

The `fts` column is generated, so it never drifts out of sync with `content`. The HNSW index operator class has to match the distance operator you query with: `vector_cosine_ops` pairs with `<=>`.

```sql
create or replace function hybrid_search(
  query_text text,
  query_embedding vector(512),
  match_count int,
  full_text_weight float = 1,
  semantic_weight float = 1,
  rrf_k int = 50
)
returns setof documents
language sql
as $$
with full_text as (
  select id,
    row_number() over (
      order by ts_rank_cd(fts, websearch_to_tsquery(query_text)) desc
    ) as rank_ix
  from documents
  where fts @@ websearch_to_tsquery(query_text)
  order by rank_ix
  limit least(match_count, 30) * 2
),
semantic as (
  select id,
    row_number() over (order by embedding <=> query_embedding) as rank_ix
  from documents
  order by rank_ix
  limit least(match_count, 30) * 2
)
select documents.*
from full_text
full outer join semantic on full_text.id = semantic.id
join documents on coalesce(full_text.id, semantic.id) = documents.id
order by
  coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
  coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
  desc
limit least(match_count, 30)
$$;
```

The `full outer join` is the important bit: a document that only one search found still makes it into the final list. `websearch_to_tsquery` accepts the kind of input users actually type (quoted phrases, `-exclusions`) without throwing a syntax error. Each CTE pulls twice as many candidates as you return, so fusion has some room to reorder.

## Calling it from Node

Embed the query with the same model and dimension count you used for the documents, then pass both the raw text and the vector:

```ts
import OpenAI from "openai";
import pg from "pg";

const openai = new OpenAI();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function search(query: string, limit = 10) {
  const { data } = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    dimensions: 512,
  });

  // pgvector accepts the '[0.1,0.2,...]' text format, which JSON.stringify produces
  const { rows } = await pool.query(
    "select id, content from hybrid_search($1, $2::vector, $3)",
    [query, JSON.stringify(data[0].embedding), limit],
  );
  return rows;
}
```

## Where it gets harder

Hybrid search is not free. You now pay for two index scans per query, and `ts_rank_cd` can't use the GIN index for ranking, only for filtering. That is fine for a few hundred matches and slow for a few hundred thousand, so keep that `where` clause selective.

The weights are tuning knobs, not magic. If your users mostly paste identifiers, raise `full_text_weight`. If they ask questions in plain language, raise `semantic_weight`. Don't guess: put 30 real queries with known-good answers in a test file and measure which settings put the right document in the top five.

Also be clear about when you don't need this at all. If your search box is for product codes or log lines, plain full-text search is simpler and better. If your corpus is short, conversational answers, vectors alone may be fine. Hybrid search earns its keep when your users type both kinds of query and you can't predict which.

## The takeaway

When retrieval misses an obvious exact match, the problem usually isn't your chunking or your embedding model. The real issue is asking a meaning-based index to do a string-matching job. Add a generated `tsvector` column, fuse the two rankings with RRF, and let Postgres handle both. You get the exact-match recall of keyword search and the paraphrase tolerance of embeddings without another service to run.
