---
extends: _layouts.post
section: content
title: Moving From Sublime to Atom
date: 2015-07-12
categories: []
published: true
---

I try to keep a semi-open mind when I see a new tool like Atom.  I had tried a few new editors such as Brackets which was really cool but still had some growing up to do.  I also tried PHPStorm I kind of miss using a full fledged IDE but I really want something a little more flexible.  I still plan on using Sublime since it does still have a little better text searching and editing than Atom.  Also Atom is a little buggier than Sublime but it is under really active development which is something Sublime seems to be iffy on.

Atom has almost all of the same benefits of Sublime with a few exceptions.  I really miss being able to search with `cmd`+`p` not only for files but other items as well. You can search for text with a `#{text}`, go to line with `:{line}`, and go to symbol with `@{symbol}`.  Granted Atom can still do the go to line with `ctrl`+`g` which feels a little strange now and yoy can go to symbol with `cmd`+`r`.  However I have not found a better soultion to the search for text than `cmd`+`f` which does not provide the same value as Sublimes text search.

I also really miss [semantic highlighting](https://medium.com/@evnbr/coding-in-color-3a6db2743a1e) which Atom currently has it for JavaScript via the [Launguage JavaScript Semantic](https://atom.io/packages/language-javascript-semantic) package.  However it currently does not have support for any other languages other than JavaScript.  Hopefully more will be added in the future or maybe I should just build and they will come...lol

The final big thing that Sublime still has over Atom is the speed honestly I may be partial to Sublime but I have never used a faster editor.  Granted it has some issues with huge text files but other than that it never slows down.  Even with a large amount of plugins installed doing all types of things.  I am sure this is something we will see improved in the future since Atom just hit [1.0.0](http://blog.atom.io/2015/06/25/atom-1-0.html).

Now for the spots were Atom shines, the biggest for me is the feeling of active development.  Sublime Text feels like it has somewhat stagnated over the past year I only remember one update granted it brought one of the best improvements it could have being able to remember words in spell check. Also the plugin landscape is roughly the same as Sublime Text in terms of quality plugins that I have an interest in.

I also like the mixture of a JSON/Coffescript config and a UI to handle settings changes.  I sometimes feel that having to configure your editor through JSON turned some developers off of Sublime Text at first.  Granted it was the first one I know of to make this change outside of the terminal. Atom followed in Sublime's foot steps in this and many other ways. Really Atom is almost Sublime Text built in HTML/CSS/JS.

Which brings me to another big strength and possibly a big weakness in a sense everything is built in HTML/CSS/JS. This will allow a larger amount of developers to add and maintain plugins as well as themes. No more editing XML files for syntax themes just edit the CSS/Less. Granted to build plugins you will need some experience with Javascript and Node which honestly is less of a hurdle than Python.

In all I honestly think either Sublime Text or Atom are extremely good options if you are not interested in a full fledged IDE. I personally chose to jump ship to Atom on the fact it feels more actively developed. As a maintainer of projects that have fallen by the wayside I know how difficult it is to keep working on a project.
