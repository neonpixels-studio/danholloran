---
extends: _layouts.post
section: content
title:  Setting Up a Jekyll Blog - Part 4
date: 2015-08-09
categories: []
series:
  url: "/2015/08/10/setting-up-a-jekyll-blog-part-5/"
  label: "Setting Up a Jekyll Blog - Part 5"
published: true
---

So now that we know how to get started with building the structure of our site we can start styling. Since Jekyll is based on Ruby it makes sense that the preprocessor of choice is [Sass/SCSS](http://sass-lang.com). I personally use SCSS but you could technically us [Less](http://lesscss.org), [Stylus](https://learnboost.github.io/stylus/), [PostCSS](https://github.com/postcss/postcss) or whatever suits your fancy.

So I will not go too much into the others but I will go through using Sass the Jekyll way. I hope to have a more in depth series on [Gulp](http://gulpjs.com)/[Grunt](http://gruntjs.com) soon. When I do I'll add a link to it here as well. I personally use Gulp to handle compiling my SCSS among many other things. I have recently migrated from Grunt and also use Codekit quite regularly as well. For the purpose of this post I will assume you have some experience with Sass/SCSS.

### Pre/Post-processor (Other Than Sass/SCSS)
If you want to use another pre/post-processor it will be setup the same way you normally do. Setup your compiler of choice and directories needed. Then add your `<link>` to the `<head>` and there you go. Just remember that Jekyll ignores all directories that start with an `_` so you can have an `_assets` directory that holds your pre/post-processor files and a `dist` directory for your compiled CSS files. Then every time you run `jekyll build` or `jekyll serve` Jekyll will just copy over the `dist` directory over to the Jekyll `_site` directory.

### Plain Old CSS
For using plain old CSS if thats your thing you can just place you monolithic CSS file into the css directory name it `main.css`. Then you can just delete the `_scss` directory and the `main.scss` file. Just like the post/pre-processor setup above every time you run `jekyll build` or `jekyll serve` Jekyll will just copy your CSS file over to the Jekyll `_site` directory.

### Sass/SCSS
Now for the default way to setup Sass/SCSS using Jekyll. By default Jekyll sets the 'sass_dir` to be `_sass` so this is where we will put our SCSS files. There is also a `css` directory with a `main.scss` file this file will be what allows use to compile our SCSS into the correct `css` directory. This file will also have front matter in it so Jekyll knows this is a fill it needs to do something with. This is the only SCSS file that should have front matter in it our the SCSS compiler will throw an error.

From the `main.scss` file you can set up your variables and start importing your other SCSS files. Jekyll already knows that the `_scss` directory exists so you do not have to add it to the file path when you are importing SCSS partials. So you should use `@import 'my-styles'` instead of `@import '../_scss/my-styles'` or the SCSS compiler will not know where to find your partials.

From here on out every time you run `jekyll build` or `jekyll serve` Jekyll will compile your changes. I spent part of last weekend styling my site and it was fairly enjoyable. It may be the speed of Jekyll loading compared to even a simple WordPress page. Which WordPress is where I spend most of my day do not get me wrong I love WordPress and I do not care who nows it.

However it is refreshing to gain so much speed compared to some of the ease of use with WordPress. I've seen some real improvements in the world of CMS to static site but nothing I would feel comfortable handing over to a non-technical client. I've taken a look at [Prose](http://prose.io/) which seems nice and it works with Jekyll through Github Pages. There also is [Roots](http://roots.cx/), not to be confused with the the WordPress theme/tooling [Roots](https://roots.io), that has a WordPress integration. That is a discussion for another day though.

So there you have it I think we are getting pretty close to being able to deploy our site out into the wild. Up next we will go through setting up a Jekyll site in production.
