---
extends: _layouts.post
section: content
title: Has WP_Query Abstracted To Much?
date: 2015-08-18
categories: []
published: true
---
I was working on a project recently where I ran into a situation where `WP_Query`, well actually it was `WP_User_Query`, just would not work. So I feel back to raw SQL through `wpdb` and to my astonishment PHPCS with WordPress coding standards discourages the use of `wpdb`. I know it is not a total outright do not use but still. It got me to thinking maybe `WP_Query` abstracts too much away from the developer.

I am definitely not advocating writing MySQL you should use some layer of abstraction primarily for security reasons. Not because MySQL is insecure, but you are human it is safer if the tool you use forces you to be secure. Which `WP_Query` definitely makes your code more secure but it can make it harder to understand what is going on under the hood. This can be an issue with performance if you are not careful. WordPress can be somewhat of a black box that can hurt you just as much as it helps.

If you are not already using [Query Monitor](https://wordpress.org/plugins/query-monitor/) go download it right now and run it on one of your sites. Preferably on a page that is rather complex with many queries you may be surprised what you find. It helps to open the black box up a little so you can see the actual queries that run on every page. This is somewhat eye-opening since you look at `WP_Query` as how retrieve posts. However, you never may actually see how `WP_Query` actually retrieves posts.

Granted in the majority of cases `WP_Query` is probably more efficient than you writing the queries yourself. It definitely makes it easier to retrieve data than writing your own MySQL. Which is the primary reason why I think it abstracts a little too much since you are removed from the database in almost every situation. If something is easy everyone will be able to do it even if they do not understand the consequences which are why WordPress sometimes gets a bad wrap for being slow. Between slow MySQL queries and plugins loading more resources then they need these are the primary issues, I have seen on WordPress page speed.

The one thing I would love to see abstracted which `WP_Query` does not is to allow for different database drivers. This could definitely improve performance depending on what type of data you are storing. Granted WordPress is an older project and I know a few releases back everything was migrated from the MySQL extension to MySQLi. However, I would love to see WordPress migrate to using [PDO](http://php.net/manual/en/book.pdo.php) which you actually interact with much like you would have with `$wpdb`. I know this is just a wish and being an older project it would be a monumental task to migrate I would guess. However, this is one of the main reasons why you abstract things like database access. If you have to update it at a later date it's much easier to update a few classes instead of many random files.

I think it is just something to ponder. It is definitely an issue I have seen with a lot of tools that seem like a black box. Unfortunately in those situations it almost seems like there is an aversion to peer inside. You do not need to know everything about the tools you use but you should at least know why you are using them. This will help you make an informed decision next time you need to use the black box tool.
