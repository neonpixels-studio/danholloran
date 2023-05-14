---
extends: _layouts.post
section: content
title:  My 5ish Favorite Atom Plugins
date: 2015-07-19
categories: []
published: true
---

So I have been migrating from using [Sublime Text](http://www.sublimetext.com/3) lately after using it exclusively for the past 3 or so years to [Atom](https://atom.io/). So I figured I would document my current 5 or so favorite plugins. I am sure a lot of them have ended up on multiple top 5 lists but hopefully you will find a new one.

### [Atom Beautify](https://atom.io/packages/atom-beautify)
Atom Beautify makes beautifying your code really easy. Sublime Text had some beautification plugins but none that where all in one place. The only issue is I have not been able to figure out the PHP beautifier to make it work how I like. I am sure I will be able to eventually. The Javascript and SCSS beautifiers are really helpful especially since they use the same configuration files as my linters. It also would be nice if you disabled a language that the options for that language would go away. However I still am definetly a fan of this plugin especially since it has support for almost any language I could ever want.

### [Dockblockr](https://atom.io/packages/docblockr)
Dockblockr helps adding Doc Blocks to your code it supports both Javascript and PHP among other languages. This is basically a port of the Sublime Text plugin which was one of my favorites on Sublime Text as well. It makes it super easy to add a doc block just type {/**} + {tab} on the line before a structural element. It will handle setting up your parameter values, return value, and whatever else you need. You are commenting your code right? Right?

![Dockblockr Example](/assets/img/dockblockr.png)

<br><br>

###[Linter](https://atom.io/packages/linter)
Linter is an excellent code linter for Atom. I liked the [SublimeLinter](http://www.sublimelinter.com/en/latest/) plugin for ST3 and this one functions much in the same way. It handles all of the repetitive core tasks that new linters can extend. I also prefer the way it displays the errors over that of SublimeLinter. In both SublimeLinter and Linter both show the lines that have issues with dots in the gutter. However I never liked the option to display all of the errors on save since it would open the command palette and to continue editing you would have to dismiss it. Linter handles this by listing all of the errors in a text area at the bottom of the editor so it is not in your immediate field of vision but it is still annoying enough so you do not dismiss it. You also get the error on the current line as a tooltip as well which helps when fixing a large set of issues. I personally use [JSHint](https://atom.io/packages/linter-jshint), [JSCS](https://atom.io/packages/linter-jscs), [SCSSLint](https://atom.io/packages/linter-scss-lint), [PHPCS](https://atom.io/packages/linter-phpcs), and [YAML](https://atom.io/packages/linter-js-yaml) however there is a large [list of supported linters](http://atomlinter.github.io/). You are linting your code right? Right?

![Linter Example](/assets/img/linter.png)

<br><br>

### [File Icons](https://atom.io/packages/file-icons)
File Icons is an excellent idea display a small simple icon to show what the type of file is. I know I could just read the extension but this just seems like a much easier way to figure it out by a quick glance. I had started to use a theme which include the same thing prior to leaving sublime. However it is so much nice that I am not tied to any one theme since I spend at least 8 hours every day staring at my editor its nice to change it up once in a while.

![File Icons Example](/assets/img/file-icons.png)

<br><br>

### [Pigments](https://atom.io/packages/minimap-pigments)/[Minimap Pigments](https://atom.io/packages/minimap-pigments)
Pigments basically highlights any color in your files the actual color. So no more guessing is the hex value the correct one you can just see it. It also helps with autocompletion of your colors and variables which is awesome. It also has a plugin for the minimap as well which is just kind of cool. I had a plugin like this on ST3 though it seemed to conflict with some other plugins and did not have the autocomplete for colors.

![Pigments Example](/assets/img/pigments.png)

<br><br>

### [WordPress for Atom](https://atom.io/packages/atom-wordpress)
WordPress for Atom is basically WordPress completions which is very helpful since my primary focus is WordPress. I also like this one over the ST3 version since it does not add semicolons at the end of every function. Sometimes you need to nest a function within a function and it is almost more effort to remove the semicolon then to add it. I also believe there are plugins that will handle adding a semicolon to every line.

Well, there you have it another top 5ish of my favorite blanks for my blank. I just figured I would share since eI have been enjoying messing with Atom a lot lately.
