---
date: "2026-10-29T02:14:46.000-07:00"
tags: ["laravel", "php", "web-apis"]
draft: false
title: "Laravel 13 JSON:API Resources: Spec-Compliant Responses Without a Package"
image: "/images/posts/laravel-13-jsonapi-resources-spec-compliant-responses-without-a-package.jpg"
topic: "development"
description: "Laravel 13 ships a first-party JsonApiResource that handles type/id objects, includes, sparse fieldsets, and the right Content-Type header. Here's how it works and where you still need to do the work yourself."
---

Every team that builds a JSON API eventually has the same argument. Should relationships be nested or side-loaded? Is the ID a string or an integer? How does the client ask for fewer fields? You can settle it in a wiki page, or you can adopt [JSON:API](https://jsonapi.org/), a spec that already answered all of those questions. The catch in Laravel has always been that adopting the spec meant adopting a package, plus that package's opinions about routing, schemas, and controllers.

Laravel 13 removes that catch. It ships `JsonApiResource`, a first-party resource class that extends the `JsonResource` you already know and produces spec-compliant output. It handles resource objects, relationships, `include`, sparse fieldsets, links, meta, and the `application/vnd.api+json` header. Your existing resources keep working, so you can adopt it one endpoint at a time.

## From Model to Resource Object

Generate one with the new `--json-api` flag:

```bash
php artisan make:resource PostResource --json-api
```

The generated class gives you two properties instead of a `toArray` method:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class PostResource extends JsonApiResource
{
    public $attributes = [
        'title',
        'body',
        'created_at',
    ];

    public $relationships = [
        'author' => UserResource::class,
        'comments',
    ];
}
```

Return it the same way you return any resource, with `new PostResource($post)` or `$post->toResource()`, and the response comes back in the shape the spec requires:

```json
{
  "data": {
    "id": "1",
    "type": "posts",
    "attributes": {
      "title": "Hello World",
      "body": "This is my first post.",
      "created_at": "2026-10-28T14:02:11.000000Z"
    }
  }
}
```

Look at what you didn't write. The `id` is cast to a string, which the spec requires and hand-rolled APIs often get wrong. The `type` comes from the class name, so `PostResource` becomes `posts` and `BlogPostResource` becomes `blog_posts`. When those defaults are wrong, for example an `AuthorResource` wrapping a `User` model or a public UUID instead of the primary key, override `toType()` and `toId()`:

```php
public function toType(Request $request): string
{
    return 'authors';
}

public function toId(Request $request): string
{
    return (string) $this->uuid;
}
```

If you need computed values, override `toAttributes()` instead of using the property. Closures in that array are evaluated lazily, so an expensive attribute only runs when it actually ends up in the response:

```php
public function toAttributes(Request $request): array
{
    return [
        'title' => $this->title,
        'is_published' => fn () => $this->published_at !== null,
        'reading_time' => fn () => $this->calculateReadingTime(),
    ];
}
```

## Includes and Sparse Fieldsets Come Free

This is where the class earns its place. Relationships are **not** serialized by default. They only appear when the client asks for them:

```
GET /api/posts/1?include=author,comments
```

The `data` object then gets a `relationships` key holding identifier objects (`{ "id": "1", "type": "users" }`), and the full related records go into a top-level `included` array, so each one appears once no matter how many posts reference it. Nested paths use dot notation (`?include=comments.author`). Nesting depth is capped by default, and you can raise or lower the cap with `JsonApiResource::maxRelationshipDepth(3)` in a service provider.

Sparse fieldsets work the same way. A mobile list view that only needs titles can ask for them, per resource type:

```
GET /api/posts?fields[posts]=title,created_at&fields[users]=name
```

You don't write any parsing code for either of these. For an internal endpoint where you want fixed output whatever the query string says, chain `->ignoreFieldsAndIncludesInQueryString()` onto the resource.

## What It Doesn't Do for You

`JsonApiResource` is a **serializer**. It shapes the response. It doesn't build your query, and that leaves two gaps you have to close yourself.

First, eager loading. The resource resolves a relationship when the client includes it, but the docs make no promise that it batch-loads that relationship across a collection. On a list endpoint, assume `?include=author` can turn into one query per post unless you load it up front. The safe pattern is to eager-load from an allowlist built from the same query parameter:

```php
use App\Models\Post;
use Illuminate\Http\Request;

Route::get('/api/posts', function (Request $request) {
    $allowed = ['author', 'comments', 'comments.author'];

    $includes = array_values(array_intersect(
        explode(',', (string) $request->query('include', '')),
        $allowed,
    ));

    return Post::with($includes)->latest()->limit(20)->get()->toResourceCollection();
});
```

Turn on `Model::preventLazyLoading()` in development and the first missed eager load will throw instead of quietly slowing down production.

Second, filtering and sorting. JSON:API reserves `filter` and `sort` parameters, but Laravel's resource ignores them. The Laravel docs point to [Spatie's Laravel Query Builder](https://spatie.be/docs/laravel-query-builder) for that side. It also gives you `allowedIncludes()`, which replaces the hand-written allowlist above.

If you also need full spec compliance on writes (validating `application/vnd.api+json` request bodies, relationship endpoints, error objects), a full framework like [Laravel JSON:API](https://laraveljsonapi.io/) still covers more ground. The first-party class only handles reads.

## Should You Switch?

If your API already has consumers built around your current response shape, don't migrate it just for tidiness. The shape _is_ the contract, and changing it is a breaking change for every client. Where `JsonApiResource` pays off is a new API, a new version prefix, or a public API where third-party clients will thank you for following a spec they already have tooling for. Start with one endpoint, put `Model::preventLazyLoading()` in place, and read the [JSON:API resources section of the Laravel docs](https://laravel.com/docs/13.x/eloquent-resources#jsonapi-resources) for the `toLinks()` and `toMeta()` hooks this post skipped.
