---
date: "2026-07-30T02:08:06.000-05:00"
tags: ["laravel", "php", "tooling"]
draft: false
title: "Laravel 13 PHP Attributes: Config That Lives With Your Code"
image: "/images/posts/laravel-13-php-attributes-config-that-lives-with-your-code.jpg"
topic: "development"
description: "Laravel 13 expands first-party PHP attributes across controllers, authorization, and queued jobs. Here is what actually changed, and where attributes are still the wrong tool."
---

You open a job class to work out why it hammered a third-party API twenty-five times before giving up. The answer is not in the class body. It is in a `$tries` property near the top, or a `backoff()` method near the bottom, or neither, because someone set it on the dispatch call instead. The same scavenger hunt happens with controllers: the middleware protecting an action lives in a route file three directories away from the method it protects.

Laravel 13, released March 17th, 2026, does not fix that by inventing new behavior. It fixes it by letting you declare the existing behavior as a PHP attribute sitting directly above the thing it configures. The release notes call this "expanded first-party PHP attribute support," which undersells how much of the framework it touches: controllers, authorization, queues, Eloquent, events, notifications, validation, and testing all got attribute-first options.

## Middleware and authorization stop living in the route file

Before, assigning middleware inside a controller meant implementing `HasMiddleware` and writing a static `middleware()` method that returned an array. It worked, but it was ceremony, and the mapping between a middleware and the method it guarded was expressed as a string in an `only:` or `except:` list.

Now the attribute goes where you would look for it:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Attributes\Controllers\Middleware;

#[Middleware('auth')]
class UserController
{
    #[Middleware('log')]
    #[Middleware('subscribed')]
    public function index()
    {
        // ...
    }
}
```

Class-level attributes apply to every action. Method-level attributes are merged on top, so `index()` above runs `auth`, `log`, and `subscribed`. The `only:` and `except:` arguments still exist at the class level if you prefer that shape, and `#[Middleware]` even accepts a static closure for one-off inline middleware.

Policy checks get the same treatment through `#[Authorize]`, which is shorthand for the `can` middleware:

```php
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Routing\Attributes\Controllers\Authorize;

class CommentController
{
    #[Authorize('create', [Comment::class, 'post'])]
    public function store(Post $post)
    {
        // ...
    }

    #[Authorize('delete', 'comment')]
    public function destroy(Comment $comment)
    {
        // ...
    }
}
```

First argument is the ability, second is the model class or route parameter handed to the policy. The win is not fewer characters. It is that a code reviewer skimming `destroy()` can see the authorization rule without opening a second file.

## Queue configuration becomes readable at a glance

Queued jobs picked up the largest set of attributes, all under `Illuminate\Queue\Attributes`:

```php
<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\MaxExceptions;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;

#[Tries(25)]
#[MaxExceptions(3)]
#[Backoff([1, 5, 10])]
#[Timeout(120)]
class ProcessPodcast implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        // ...
    }
}
```

That block answers the question I opened this post with in four lines: twenty-five attempts, but bail after three unhandled exceptions, waiting 1, then 5, then 10 seconds between retries, killing any single attempt that runs past two minutes. `#[Backoff]` takes a single integer for a flat delay or an array for a progression. There is also `#[FailOnTimeout]`, which marks a job as failed rather than retrying when it exceeds its timeout.

Laravel 13 pairs this with a change pointing in the opposite direction. `Queue::route()` lets you declare, in one service provider, which connection and queue a job class lands on:

```php
Queue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts');
```

That is deliberate. Retry semantics belong to the job because they describe how the work behaves. Infrastructure routing belongs to a central file because it changes with your deployment, not with your code.

## Where attributes are the wrong answer

PHP attribute arguments must be compile-time constant expressions. Anything computed at runtime cannot go in an attribute. If your backoff depends on a response header, or your timeout scales with the size of the payload, you still need the method or property form. The attributes are additive, not a replacement, and every older API still works.

The other trap is scattering. Attributes make configuration local, which is a genuine improvement for anything that describes a class's own behavior. It is a regression for anything you will later need to audit across the codebase. "Which jobs run on the Redis connection" is a question you want to answer by opening one file, not by grepping for `#[Queue]`.

Upgrading is the easy part. Laravel 13 raises the minimum PHP version to 8.3 and was built around minimizing breaking changes, so most applications move over without touching application code. Laravel 12 gets bug fixes until August 13th, 2026 and security fixes until February 24th, 2027, so there is room to plan. Start with the queue attributes on your noisiest job. It is the change with the highest ratio of clarity gained to lines touched.
