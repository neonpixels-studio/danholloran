---
extends: _layouts.post
section: content
title:  "Linting Your Code: Installing the Linters"
date: 2015-08-27
categories: []
published: true
---
Linting is basically the act of running your code through a tool that catches syntax issues, common pitfalls, and helps enforce a general coding style among other things. This does not actually test the code like a unit test or integration test. How ever it helps stop you from shooting yourself in the foot with simple typos.

Such as `if ( $foo = 1 )...` which technically would always evaluate to true. A linter will through help by notifying you that something is not quite right and you can fix your code to be `if( 1 === $foo )...`  which sets `$foo` to strictly equal `1` and even if you created the first typo of `=` instead of `==` PHP would throw an error.

Installing code linters is pretty simple as long as you have a few perquisites installed. Node.js, NPM, Ruby, Git, Homebrew, and Homebrew PHP are all required to install the linters. If you do not have these items installed or your not sure [check out this post](/2015/08/26/base-environment-setup/) that will help you get started. We will be installing [SCSS-Lint](https://github.com/brigade/scss-lint), [JSHint](http://jshint.com/), [JavaScript Code Style (JSCS)](http://jscs.info/), and [PHP Code Sniffer (PHPCS)](https://github.com/squizlabs/PHP_CodeSniffer) with [WordPress Coding Standards](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards).

SCSS-Lint handles linting your Sass/SCSS code if you use Stylus check out [Stylint](https://www.npmjs.com/package/stylint), plain old CSS check out [CSSLint](http://csslint.net/), and for LESS if you know of a linter I would love to hear about it. JSHint and JSCS are both for Javascript I have also heard good things about [ESLint](http://eslint.org/) which is installed pretty much the same way as JSHint. PHPCS handles linting your PHP code there is also [PHP Mess Detector (PHPMD)](http://phpmd.org/). However, I do a large amount of WordPress work and PHPCS already has WordPress Coding Standards so it works for me.

So lets get started!

 *Everything with a $ should be ran in the terminal without the ($ ).*

<br>

### Installing PHPCS

*Installing PHPCS is the hardest of the linters the rest should be fairly simple.*

```bash
$ brew install php-code-sniffer
```

Make sure linter is in your $PATH (It should return the path to the executable)
```bash
# /usr/local/bin/phpcs
$ which phpcs
```

Go to the PHPCS directory
```bash
# Make sure to change {PHPCS_VERSION} to the installed PHPCS version 2.3.2 is the current version as of this post.
$ cd /usr/local/Cellar/php-code-sniffer/{PHPCS_VERSION}/CodeSniffer/Standards
```

Install WordPress PHPCS standards
```bash
$ git clone -b master` https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards.git wpcs
```

Add WordPress standards to PHPCS configuration.

```bash
# Make sure to change {PHPCS_VERSION} to the installed PHPCS version 2.3.2 is the current version as of this post.
$ phpcs --config-set installed_paths /usr/local/Cellar/php-code-sniffer/{PHPCS_VERSION}/CodeSniffer/Standards/wpcs
```

Check the installed standards, make sure one is WordPress.
```bash
$ phpcs -i
```

Set the default standard.
```bash
$ phpcs --config-set default_standard WordPress
```

<br>


### JSCS Installation
Install JSCS
```bash
$ npm install -g jscs
```
Make sure linter is in your $PATH (It should return the path to the executable)
```bash
# /usr/local/bin/jshint
$ which jscs
```

Configuration is handled via the [.jscs.json](http://jscs.info/overview.html#-config-c) you can read more about the available configuration options [in the docs](http://jscs.info/rules.html).

You can check out my [JSCS configuration](https://github.com/DHolloran/linter-examples/blob/master/.jscs.json).

<br>


### JSHint Installation
Install JSHint
```bash
npm install -g jshint
```

Make sure linter is in your $PATH (It should return the path to the executable)
```bash
$ which jshint
```

Configuration is handled via the [.jshintrc](http://jshint.com/docs/) you can read more about the available configuration options [in the docs](http://jshint.com/docs/options/).

You can check out my [JSHint configuration](https://github.com/DHolloran/linter-examples/blob/master/.jshintrc).

<br>

### SCSS-Lint Installation
Install SCSS Lint
```bash
$ gem install scss_lint
```

3. Make sure linter is in your $PATH (It should return the path to the executable)
```bash
$ which scss-lint
```

Note: Configuration is handled via the
Configuration is handled via the [.scss-lint.yml](https://github.com/brigade/scss-lint#configuration) you can read more about the available configuration options [in the docs](https://github.com/brigade/scss-lint/blob/master/lib/scss_lint/linter/README.md).

You can check out my [SCSS-Lint configuration](https://github.com/DHolloran/linter-examples/blob/master/.scss-lint.yml).

<br>

### Wrapping Up
Well that was not too bad was it? No I didn't think so. As it stands now you could run each linter via the command line and see the issues. However, that is definitely not an efficient way to lint your code. Luckily for you there are plugins for [Atom](https://atom.io/) and [Sublime text 3](http://www.sublimetext.com/3) which are easy to get setup. You can lean how to [install the Sublime Text 3 linters here](/2015/08/30/installing-linters-sublime-text-3/). You can also run them with your build tools such as [Grunt.js](http://gruntjs.com/) or [Gulp.js](http://gulpjs.com/) even though I personally prefer the inline linting of the editors.
