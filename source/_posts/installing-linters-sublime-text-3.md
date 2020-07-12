---
extends: _layouts.post
section: content
title:  Installing Linters Sublime Text 3
date: 2015-08-30
categories: []
published: true
---
Sublime Text is one of my favorite editors I have ever used and it has excellent support for linting. This will cover Sublime Text 3 only since the plugin used SublimeLinter went through a major shift from Sublime text 2 to 3. The biggest difference is in ST2 the linters where bundled with the plugin now in ST3 they are created as plugins.

So we will go through the steps to get them setup and configured for Sublime Text 3. The linter plugins all have some requirements you can check out [Linting Your Code: Installing the Linters](/2015/08/27/linting-your-code-installing-the-linters/) to get all of the requirements installed.

*Everything with a $ should be ran in the terminal without the ($ ).*

### Package Control Installation
If for some reason you have been using Sublime Text 3 without Package Control you need to install it now. You can get the installation instructions via the [Package Control website](https://packagecontrol.io/installation).

<br>

### Installing plugins via Package Control

*This will be referred to as install "X Package" via Package Control.*

1. Open the command palette `cmd+shift+p`
2. Type `install` and select `Package Control: Install Package` from the command palette.
3. Wait for the list of available packages to load and then start typing the name of the package until you see the plugin you want to install.
4. Click on the package you want to install.
5. Once the plugin is installed you should receive an install notice.
6. Restart Sublime after all packages you need are installed.

<br>

### Linter Installation
All of the linters require the [SublimeLinter Plugin](http://sublimelinter.readthedocs.org/en/latest/installation.html) to be installed first.

1. Install `SublimeLinter` via package control.
2. Install `SublimeLinter-phpcs` for [PHP Code Sniffer](https://github.com/squizlabs/PHP_CodeSniffer) via package control.
3. Install `SublimeLinter-jshint` for [JSHint](http://jshint.com/) via package control.
4. Install `SublimeLinter-jscs` for [JSCS](http://jscs.info/) via package control.
5. Install `SublimeLinter-contrib-scss-lint` for [SCSS-Lint](https://github.com/brigade/scss-lint) via package control.
6. Restart Sublime

<br>

### General Linter Configuration

To configure the linters is fairly simple you will need to duplicate the default settings before starting. Copy the default settings under `Preferences > Package Settings > SublimeLinter > Settings - Default` to `Preferences > Package Settings > SublimeLinter > Settings - User`.

You can change the gutter theme, lint mode, mark style, show errors on save and other settings. You can edit them from the command palette `cmd+shift+p` and searching for SublimeLinter. The gutter theme is the icon in Sublimes gutter area. The lint mode is when the linter should run I would suggest either Background or Load/Save if Background slows down Sublime too much. Mark style handle how the error will be shown in the code.  Show errors on save is one thing I would suggest to disable since it can be rather annoying but thats up to you.

<br>

### PHP Code Sniffer(PHPCS) Configuration

One last thing you may want to edit is to set WordPress as the default PHPCS standard this so far has been the only linter I had to manually configure. In `Preferences > Package Settings > SublimeLinter > Settings - User` under linters you just need to set `phpcs.standard` to WordPress.
```javascript
"linters": {
	"phpcs": {
		"standard": "WordPress"
	},
},
```

<br>

### Wrapping Up
Ok well that is all it really takes to get up and linting on Sublime Text 3. It is extremely simple and the little time spent to setup linting will pay off quickly. Well written code is worth the little bit of time up front it takes to make it a conscious decision. It can be just as helpful as commenting your code and writing tests.
