---
date: "2026-11-09T02:15:12.000-08:00"
tags: ["laravel", "performance", "tooling"]
draft: false
title: "Laravel 13 Vector Search: Semantic Queries Without a Search Service"
image: "/images/posts/laravel-13-vector-search-semantic-queries-without-a-search-service.jpg"
topic: "development"
description: "Laravel 13 adds whereVectorSimilarTo, vector columns, and an AsVector cast, so meaning-based search can live in the Postgres or MariaDB database you already run."
---

A user types "cheap places to stay near the beach" into your help center search, and your `LIKE '%beach%'` query returns an article about beach volleyball rules. Meanwhile, the article titled "Budget Coastal Rentals" sits unfound because none of its words match. Full-text search helps with stemming, but it still matches words, not meaning.

The usual fix has been to bolt on a dedicated vector database or a hosted search service, then write a sync pipeline to keep it in step with your models. Laravel 13 removes most of that work. Vector columns, an Eloquent cast, and a `whereVectorSimilarTo` query builder method now ship in the framework, so semantic search can live in the database you already run.

## What you need before you start

Vector search in Laravel 13 depends on two things. First, a database that can store and compare vectors: PostgreSQL with the `pgvector` extension or MariaDB 11.7 and later (MongoDB works through the Laravel MongoDB package). Second, the first-party [Laravel AI SDK](https://laravel.com/docs/13.x/ai-sdk), which handles calling an embedding provider and turning text into arrays of numbers.

An embedding is a long array of floats, often 1,536 of them, that encodes what a piece of text means. Texts with similar meanings land close together in that space, so "budget coastal rentals" and "cheap places near the beach" end up neighbors even with zero shared words.

The migration side is short:

```php
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

Schema::ensureVectorExtensionExists();

Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('team_id')->constrained();
    $table->string('title');
    $table->text('body');
    $table->vector('embedding', dimensions: 1536)->nullable()->index();
    $table->timestamps();
});
```

`ensureVectorExtensionExists()` enables `pgvector` if it is not already on, and calling `index()` on a vector column creates an HNSW index using cosine distance. The `dimensions` value has to match your embedding model exactly, so 1536 for OpenAI's `text-embedding-3-small`. Swap models later and you are re-embedding every row, so pick deliberately.

On the model, the `AsVector` cast converts between PHP arrays and the database vector format:

```php
use Illuminate\Database\Eloquent\Casts\AsVector;

protected function casts(): array
{
    return [
        'embedding' => AsVector::class,
    ];
}
```

## Generating and storing embeddings

Embedding generation is a network call to a paid API, so it does not belong in a request cycle or a model `saving` hook. Push it to a queued job, and batch where you can. The AI SDK's `Embeddings` class sends many inputs in one API call:

```php
use App\Models\Article;
use Laravel\Ai\Embeddings;

Article::whereNull('embedding')
    ->chunkById(100, function ($articles) {
        $response = Embeddings::for(
            $articles->map(fn ($a) => $a->title . "\n\n" . $a->body)->all()
        )->generate();

        foreach ($articles->values() as $i => $article) {
            $article->update(['embedding' => $response->embeddings[$i]]);
        }
    });
```

Embedding the title together with the body gives the vector more signal for short articles. For long documents, you will get better matches by splitting the content into chunks with their own rows and embeddings, because one vector has to summarize everything it covers.

## Querying by meaning

With embeddings stored, the search itself is one method:

```php
$results = Article::query()
    ->where('team_id', $user->team_id)
    ->whereVectorSimilarTo('embedding', $request->input('q'), minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

`whereVectorSimilarTo` compares stored vectors using cosine similarity, drops anything below `minSimilarity` (a value from 0.0 to 1.0), and orders results with the closest match first. When you pass a plain string, Laravel embeds it for you with your configured provider, so the user's query goes straight in.

That convenience has a cost: every search is now an embedding API call, with the latency and per-token billing that comes with it. Turn on embedding caching in `config/ai.php` (`caching.embeddings.cache`), which keys results on provider, model, dimensions, and input and keeps them for 30 days. Popular queries then skip the network entirely.

If you need the raw numbers, the lower-level methods expose them:

```php
$results = Article::query()
    ->select('*')
    ->selectVectorDistance('embedding', $queryEmbedding, as: 'distance')
    ->whereVectorDistanceLessThan('embedding', $queryEmbedding, maxDistance: 0.3)
    ->orderByVectorDistance('embedding', $queryEmbedding)
    ->limit(10)
    ->get();
```

Selecting the distance is handy while you tune thresholds. Log a few real queries with their distances and you will quickly see where relevant results stop and noise starts. A threshold copied from a blog post (including this one) is a starting guess, not a setting.

## When vector search is the wrong tool

Semantic search is great at intent and bad at exactness. A user searching for an order number, a SKU, or an error code wants an exact match, and embeddings will happily return "similar-looking" codes. Keep `whereFullText` or a plain `where` for those cases, and consider routing queries that look like identifiers away from the vector path.

Also watch the combination of filters and approximate indexes. An HNSW index finds nearest neighbors first and your `where` clauses filter after, so a narrow filter like a single small team can return fewer than ten results. Newer `pgvector` releases add iterative index scans to help, but test with realistic data.

Laravel's [search documentation](https://laravel.com/docs/13.x/search) also covers a hybrid pattern worth knowing: retrieve 50 candidates with fast full-text search, then reorder them with the AI SDK's `rerank` collection macro. For many apps that beats pure vector search on both cost and relevance. Start with the version that needs the least infrastructure, measure it against real queries, and only add moving parts when the logs say you need them.
