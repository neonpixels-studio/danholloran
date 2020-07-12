---
extends: _layouts.post
section: content
title:  Looking Into Statamic Flat File CMS
date: 2016-06-14
categories: []
published: true
---
I still have not built anything with [Statamic](https://statamic.com/) but it seems really promising. Even at $200 a license I believe it would be worth it. Well at least if you are working on a site for a business. I would like to use it for my personal site with the static file caching mode so it would be much like the static site I have now with Jekyll. In that case $200 may be a little too much since as a developer I am fine compiling my blog and deploying it.

Recently at work we have been doing some work with Laravel and Vue.js. We do primarily WordPress websites which tend to break down when iterating since they are notoriously hard to programmatically test. Also as great as the plugin system is it cannot compare to using composer with smaller packages. One of the biggest upsides is the ease of use on the back end. I would say the administrator area and the community have been the two biggest factors that has kept me coming back.

However, building more complex UIs it starts to break down. The built in templating system has not changed in a long time. I prefer the separation of data logic from view logic that a framework usually provides. The Rest API would help somewhat with this once fully implemented. However, routes would make things better.

Also the database scheme by nature of how it has to be is fairly generic and has a large amount of large MySQL text fields with small amounts of data when using large amounts of custom meta. This seems to slow sites down as they scale in the amount of data. I would prefer to have a database schema that more represents the data model of the project. Also interacting with Eloquent feels more natural to me than WP_Query/WP DB.

So I digress I had heard about [Statamic](https://statamic.com/) on the [Does Not Compute](http://spec.fm/podcasts/does-not-compute) podcast but for some reason I dismissed as being a tool like Jekyll that is just a static site generator. I think static site generators are awesome but it's hard enough to get someone to type in a text box let alone use the command line.

However it almost seems like the sweet site between framework, static site generators and a dynamic CMS. By default you have no database since everything is a file by default.

This has an interesting up side/downside. The whole site can be version controlled if you like. The tough one on that is how to you handle user generated content. Since you can both edit all the data both in the admin and in a text editor where do you draw the line. I prefer to edit as much as I can from an editor but if someone changes an option on the production site this whole utopia collapses.

It also to a point will be faster since you do not have a database. However at that point maybe it is not the right tool for the job or you can have a hybrid since you do have access to Laravel.

That brings me to my next pro part is you have access to Laravel. This is a little bit weird at first how you interact with it. However everything is there if you need it.

I also really like the administrator area. It almost seems like it is WordPress if they dropped backwards compatibility. They have content types which seem a lot more flexible than post types. You can actually build whole admin pages out of the 30 some odd field types and it feels much more built in than a post meta box.

The whole administrator is built in Vue.js components so it is easy to extend. It just overall feels less cluttered it may just be that it is no where near as mature as WordPress I don't know.

You also have an indexed search built in. Instead of having to do a full MySQL text search when searching for something.

It also has routes built in sometimes you do not want to make a page just to have a URL. I know WordPress has the rewrite API but it's way more complex and restrictive to do basically the same thing.

Oh did I mention they have a form builder built in. You can also add fields in a YAML which would come in handy with a larger form with the same types of fields. It's so much easier adding repetitive things in a text editor. Instead of having to drag/drop and click through a bunch of text fields.

It's almost as if they took a list of my personal pain points and built a CMS around it. I was reading through the docs and list of features thinking all this stuff is supposed to be difficult. Apparently it is not supposed to be this way who would've thought that. I am sure I will find pain points other than what to version control.

I would actually want to use it for everything instead of WordPress if I could. I at least want to use it when the project is more of an application that also requires CMS functionality. I know a few years ago WordPress was trying to be come an application platform which you do not hear anymore. It is really hard to build newer applications with a 12 year old code base that is totally against breaking changes.

I still think WordPress deserves a place in my toolbox but it may have reached its limit or maybe just lost some of its shininess. However it is better to pick the tool that is the best for the job not the one you are most comfortable with.
