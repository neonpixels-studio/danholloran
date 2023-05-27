---
extends: _layouts.post
section: content
title:  Installing Linters Atom
date: 2015-09-13
categories: []
published: true
---
Atom is an awesome new editor built by Github it has some really good linter plugins. So we will go through the steps to get them setup and configured for Atom. The linter plugins all have some requirements you can check out [Linting Your Code: Installing the Linters](/2015/08/27/linting-your-code-installing-the-linters/) to get all of the requirements installed.

*Everything with a $ should be ran in the terminal without the ($ ).*

### Installing plugins via Atoms Package Manager

*This will be referred to as install "X Package" via Package Manager.*

There is two was to install packages in Atom either through command line tool or through preferences. Feel free to use which ever way you want I personally find that through preferences is a little easier most of the time since you can search.

#### Installing packages via Preferences.
1. Navigate to `Atom > Preferences > Install > Packages`.
1. Type the name of the package into the search box, it is a fuzzy search so you do not need to type the whole name.
1. Type `enter` to search.
1. Find the package to install and click the Install button.

#### Installing packages via Atom Package Manager(APM) CLI Tool.
1. Search the [Atom Package Repository](https://atom.io/packages/) for the package you want to install.
1. The packages name is easy to find in the URL `https://atom.io/packages/package-name/`
1. Install the package
```bash
$ apm install package-name
```

### Linter Installation
All of the linters require the [Linter Package](https://atom.io/packages/linter/) to be installed first.

1. Install `linter` via package manager.
2. Install `linter-phpcs` for [PHP Code Sniffer](https://github.com/squizlabs/PHP_CodeSniffer) via package manager.
3. Install `linter-jshint` for [JSHint](http://jshint.com/) via package manager.
4. Install `linter-jscs` for [JSCS](http://jscs.info/) via package manager.
5. Install `linter-scss-lint` for [SCSS-Lint](https://github.com/brigade/scss-lint) via package manager.
6. Restart Atom

### Linter Configuration
All of the linters have a pretty easy setup the main thing you need to know is the path to the executable. Other than that feel free to tweak the other settings until you find the mid-ground between annoying and helpful.

#### Linter
1. Navigate to `Atom > Preferences > Packages`.
1. Search for `linter`
1. Tweak settings to you're liking.

#### SCSS-Lint
1. Navigate to `Atom > Preferences > Packages`.
1. Search for `linter-scss-lint`.
1. You will need to know the location of the SCSS-Lint executable.
- ```bash
$ which scss-lint
```
1. Enter the location of the SCSS-Lint in the Executable Path setting.

#### JSHint
1. Navigate to `Atom > Preferences > Packages`.
1. Search for `linter-jshint`.
1. You will need to know the location of the JSHint executable.
- ```bash
$ which jshint
```
1. Enter the location of the JSHint in the Executable Path setting.

#### JSCS
1. Navigate to `Atom > Preferences > Packages`.
1. Search for `linter-jscs`.
1. You will need to know the location of the JSCS executable.
- ```bash
$ which jscs
```
1. Enter the location of the JSCS in the Executable Path setting.

#### PHPCS
1. Navigate to `Atom > Preferences > Packages`.
1. Search for `linter-phpcs`.
1. You will need to know the location of the PHPCS executable.
- ```bash
$ which phpcs
```
1. Enter the location of the PHPCS in the Executable Path setting.

### Wrapping Up
So there we go Atom will now be able to lint our code as we work. This is so much more efficient than having to run the tools manually. It is also more efficient then refreshing the browser to find that you have made a simple typo the linters will catch it before you get to that point.
