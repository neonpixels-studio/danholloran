---
extends: _layouts.post
section: content
title: Experimenting With Laravel and Vue.js
date: 2015-12-05
categories: []
published: true
---
So I've been playing with [Laravel](http://laravel.com/) and [Vue.js](http://vuejs.org/) which I have really started to like. It seems every time I have to write boring repetitive code there's already something that handles it for you.

It's fairly refreshing coming from the WordPresss world were a lot of this is handled via plugins. Which is great since they are easy to use but they have the draw back of loading assets on there own and saving their options to the database. Those two things we all know are the biggest bottlenecks in your sites speed. It is also nice to have testing  built in from the get go so you do not have to do any real work except to start writing test. Also with [Laravel Elixir](http://laravel.com/docs/5.1/elixir) it makes using Gulp a breeze. Your development environments are easily setup using [Laravel Homestead](http://laravel.com/docs/5.1/homestead) and [Vagrant](https://www.vagrantup.com/). The Laravel templating engine [Blade](http://laravel.com/docs/5.1/blade) is so easy to use and so much cleaner then having PHP all over your HTML. Also you have [Routes](http://laravel.com/docs/5.1/routing) which to me is a lot less painful than WordPress permalinks. There are so many things that Laravel can do.

I've really liked Vue.js reactive programming and handling all data updates via a JS object so you never have to touch the DOM. At first it is a little weird that things like event handlers are in your HTML markup but in the end it reduces the amount of JS that's has to be written. I still think jQuery has its place however, it rapidly falls apart in once you have to write a lot of it.

Do not get me wrong WordPress still has its place especially in simple marketing sites built for clients to maintain. I still have not found a better administrator experience out of the box than WordPress. I just sometimes wish the WordPress community was a little more receptive to changes in work flow such as using Composer. Sometimes it almost seems like the core WordPress team almost seems more interested in some of the newer tools than the community. I guess the right tool for the right job and all these different tools definitely have their time and place.

It almost seems like tools like Laravel and Vue.js have a different mind set. In that ease of development and maintenance on the development side is top priority. One of the best things that comes with this is that it is better for your users since there is a better chance that the site will be faster. Since there is not a large amount of database interactions for content and options.

If you want to get started with Laravel and Vue.js I suggest checking out [Laracasts](https://laracasts.com). The screencasts are amazing and will help you get up and running quickly.
