---
extends: _layouts.post
section: content
title:  Setting Up a Jekyll Blog - Part 3
date: 2015-07-29
categories: []
series:
  url: "/2015/08/09/setting-up-a-jekyll-blog-part-4/"
  label: "Setting Up a Jekyll Blog - Part 4"
published: true
---

### Jekyll + Liquid
Jekyll uses a templating language named [Liquid](http://liquidmarkup.org/) developed at [Shopify](http://www.shopify.com/). This gives you so extra abiliteis above that of plain old HTML. Such as conditionals, loops, access to variables, etc. which allows you to do things that traditionally required another language. You can find more information about Liquid on their [wiki](https://github.com/Shopify/Liquid/wiki).

### Working With Jekyll Templates
So far I have not done too much editing of the main template Jekyll comes with. I have edited the main blog roll a little and added pagination so I am going to go through a few snippets you can use on your own blog.

You can add an excerpt to your blog roll on index.html easily.
<script src="https://gist.github.com/DHolloran/e5ddb0f1a4986e574a7c.js"></script>

The double curly braces on either end denote a Liquid tag that will be output to the screen. The `post.excerpt` comes fromt the global post object which gives you access to the current post. There is also a `site` object that gives you access to configuration details. The `strip_html`, `strip_newlines`, and `truncate:160` are Liquid functions that help to clean up the excerpt before outputting it to the screen.

Liquid also has loops to make it easy to display your posts in a blog roll.

<script src="https://gist.github.com/DHolloran/6dcf1f012c35e3dbcf82.js"></script>

The curly brace ({) and percentage sign (%) denote a logical block such as a for loop. This basically goes through the posts until there are none left and then outputs a small snippet to the screen. This is a snippet taken directly from my home page right now. You can see that there is more data accessible from the `post` object. Such as `post.date` for the posts publish date and `post.title` for the post title.

In Liquid you can also use if/else statements just like you would normally in server side languages.

<script src="https://gist.github.com/DHolloran/9550ea26f737e28746c4.js"></script>

Liquid also has template includes much like PHP has `include`/`require`, Node has `require()`, etc. Liquid has its own version which is easy to use. You just need to add an HTML file into the `_includes` such as `_includes/share.html`. Then you can just include your partial HTML file into the current template with the following.

<script src="https://gist.github.com/DHolloran/d2667e1d158347b43c45.js"></script>

Liquid even has comments such as any good "programming" language should they are a little more to type than most languages but you probably will not use them as often. You can add a comment with the following.

<script src="https://gist.github.com/DHolloran/c931e3d7e3d9f6cbaf5a.js"></script>

These are only some of the possibilities with Liquid you can read more about what is possible in the [Liquid Docs](https://github.com/Shopify/liquid/wiki). You will definetly take a look at the [Liquid for Programmers](https://github.com/Shopify/liquid/wiki/Liquid-for-Programmers) or [Liquid for Designers](https://github.com/Shopify/liquid/wiki/Liquid-for-Designers) depending on your personal preference. You can always read both and you might be a unicorn...

Now that we have a basic understanding of liquid and how the templates work now its time to style our site. I will be using SCSS but you can drop in CSS, LESS, Stylus, etc. with a few small additions.
