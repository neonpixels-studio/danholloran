---
extends: _layouts.post
section: content
title:  How I (Almost...) Setup My Ghost Pro Custom Domain Name
date: 2015-03-20
categories: []
published: true
---

I was going to do a writeup about how I setup a Ghost Pro custom domain the details below almost worked.  I just love how DNS and the internetz works, you change something it changes something and everything works just nicely.  Then you go and check it the next day and the whole world has exploded. So long story short I gave up and decided to just forward the domain but I wanted to post this for fun. Feel free to post a solution or ideas in the comments below.

### How I almost setup my domain...
I just setup my Ghost pro account and had some issues getting the domain to work without the www I tried following option B in the [Docs](https://ghost.org/blogs/domains/#setup) by using [CloudFlare](https://www.cloudflare.com/) as somewhat of a middle man.

This didn't work for me not sure if I messed up the setup or what but no matter what the DNS wouldn't change. I tried forwarding the domain with no luck maybe I am just bad at this DNS/Server stuff, I am a developer not Dev Ops luckily.

So I was able to update my main A Records through [Hover](https://www.hover.com/)  to point to my IP Address.  I got that by running `ping danholloran.ghost.io` in the terminal, sure there are other ways to get it. Then I set up a CNAME record pointing @ to danholloran.ghost.io.  Then I set a forward to http://danholloran.ghost.io then finally added danholloran.com to my Ghost blog.

Not sure if this is the correct way to do it but it seems to *(almost)* work yay!!!  I so hate setting up DNS and servers I just want write code all night and push changes every day.
