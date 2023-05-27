---
extends: _layouts.post
section: content
title: Base Environment Setup
date: 2015-08-26
categories: []
published: true
---
I have a few posts in mind that require a few of the same steps so I figured I would catalog them here. These should be things every developer regardless of wether you are more of a front end or backend developer. They are extremely easy to get setup now more than ever. There was once a point where I have to fight and wrangle some of these tools I'm looking at you PHP. The upside to having these few base things installed is adding tools like [Bower](http://bower.io/) front end package management, [Grunt](http://gruntjs.com/)/[Gulp](http://gulpjs.com/)/[Broccoli](http://broccolijs.com/) for task running and [Sass](http://sass-lang.com/) for making CSS more fun. So here we go lets install all the things!!!

## Environment Setup
*Everything with a $ should be ran in the terminal without the ($).*

### Node.js

Install [Node.js](https://nodejs.org/).

```bash
# Verify Node is installed
$ node -v

# Verify NPM is installed
$ npm -v
```

### Ruby

Ruby should be already installed in Mac OS X you can check Ruby
`$ ruby -v`

At the time of this writing 2.x.x is fine if not you can install Ruby via [RVM](https://rvm.io/) by following the instructions on the [RVM website](https://rvm.io/).

### Xcode Command Line Tools

*This is required to install anything that needs to be compiled from source code.*

1. Download the [Xcode Command Line Tools](https://developer.apple.com/downloads/) for your version of Mac OS x. You may need to sign up for a free developer account.
2. Install the Xcode Command Line by clicking on the downloaded package and following the install prompts.
3. Once installed you should accept the Xcode license agreement.
```bash
$ sudo xcodebuild -license
```

### Git

*Mac OS X should have shipped with Git by default but we might as well upgrade it.*

1. Download [Git for Mac OS X](https://git-scm.com/download/mac).
2. Install Git by clicking on the downloaded package and following the install prompts.
3. Check if Git has been installed correctly.
```bash
$ git --version
```

### Homebrew

Install [Homebrew](http://brew.sh/).
You can view the install [instructions here](http://brew.sh/#install).
```bash
# As of 8/24/2015
$ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

### Homebrew PHP

Tap [Homebrew PHP](https://github.com/Homebrew/homebrew-php) to install helpful PHP Tools easily.

```bash
$ brew tap homebrew/dupes
$ brew tap homebrew/versions
$ brew tap homebrew/homebrew-php
```

### PHP
Install PHP as of this writing the current stable version is 5.6.11 but you should install the [current version](http://php.net/releases/).

```bash
# php 5.6.x === php56
$ brew install php56
```

Add this to your `~/.bashrc`, `~/.zshrc`, or other `~/.shellrc`
```bash
$ export PATH="$(brew --prefix php56)/bin:$PATH"
```

### Composer

*Composer allows you to install PHP packages with ease. Much like `npm` for Node.js and `gem` for Ruby.*

```bash
$ brew install composer
```


### Wrapping Up

So that was easy wasn't it. Now you will have even less excuse to use command line tools to increase your productivity. Now you just need to switch from Bash to ZSH with [OHMyZSH](http://ohmyz.sh/) to really super charge your workflow.
