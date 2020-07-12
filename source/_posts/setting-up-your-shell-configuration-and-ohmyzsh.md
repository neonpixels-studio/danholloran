---
extends: _layouts.post
section: content
title:  Setting Up Your Shell Configuration and OHMyZSH
date: 2016-07-03
categories: []
published: true
---
A while ago I wrote  a post on [Setting Up Your Shell](/2015/09/29/setting-up-your-shell/). I wanted to follow up with more information about ZShell and OHMyZSH. Since both have really made using the terminal a lot easier and more enjoyable. So check out [Setting Up Your Shell](/2015/09/29/setting-up-your-shell/) to get up to speed. This will be a very high overview of configuring ZSHell and OHMyZSH.

## .ZSHRC
First up is the .zshrc if you have used Bash before you may be familiar with the .bashrc. This is the file where all of your configuration will be stored. I use mine primarily for aliases to make some common commands easier to type. To an alias basically looks like this `aliasname="command"` so a quick alias for [Behat](http://docs.behat.org/), a BDD testing framework, would look like this `alias behat="vendor/bin/behat"`. You can edit your .zshrc with your code editor. I personally use Sublime Text with an `st` command setup that makes opening files from the terminal easier. You can find more information about setting up the `st` command [here](https://www.sublimetext.com/docs/3/osx_command_line.html). Once you have made any edits you need to make sure to either open a new tab or run `source ~/.zshrc` in your current tab.

## $PATH
Since command line tools may be installed in many different places your shell needs to know where too look for possible matches. This is where your `$PATH` comes in. It allows you to tell ZShell in what directories on your system to look in when trying to execute a command. Below is a list of directories added to my path. Many tools will tell you if there needs to be a special directory added such as  `~/.composer/vendor/bin` used for [Composer](https://getcomposer.org/). Where you see `${PATH}:` that is basically saying I want to append this new item to my current path. Zshell will try to look in my `/usr/local/bin` for a command and the move on to `~/.bin` and on down the list until it finds the correct tool. The `$USER` variable is used to get the current users directory name which is interchangeable with `~/`.
```bash
export PATH="/usr/local/bin:$PATH"
export PATH=${PATH}:~/.bin
export PATH=${PATH}:/usr/local/bin
export PATH=${PATH}:/usr/bin
export PATH=${PATH}:/bin
export PATH=${PATH}:/usr/sbin:/sbin
export PATH=${PATH}:/sbin
export PATH=${PATH}:/usr/X11/bin
export PATH=${PATH}:/usr/local/git/bin
export PATH=${PATH}:/Users/$USER/.rvm
export PATH=${PATH}:/Users/$USER/.wp-cli/bin
export PATH=${PATH}:/usr/local/share/npm/bin
export PATH=${PATH}:/usr/local/bin/node
export PATH=${PATH}:/Applications/MAMP/Library/bin
export PATH=${PATH}:~/.composer/vendor/bin
```

## Installing and Configuring OHMyZSH
[OHMyZSH](https://github.com/robbyrussell/oh-my-zsh) is a great companion for ZShell. It allows for a large amount of configuration of your shell with plugins and themes. It comes preset with a large amount of plugins and themes. ss well as allowing you to edit and create your own so you can customize your sehll to your hearts content  You can find the [install instructions here](https://github.com/robbyrussell/oh-my-zsh#basic-installation). You can find the full [documentation here](http://ohmyz.sh/) and below is a screenshot of my shell while I am writing this post.

![Example screenshot of my shell](/assets/img/setting-up-your-shell-configuration-and-ohmyzsh-shell-example.png)


## OHMyZSH Plugins
OHMyZSH has a large amount of plugins that you can use to add functionality to your shell. You can checkout the full list of [OHMyZSH plugins here](https://github.com/robbyrussell/oh-my-zsh/wiki/Plugins). Here is a list of the plugins I have installed git, osx, bower, brew, Composer, last-working-dir, npm, atom, sublime, gem, git-extras, git-flow, sudo, laravel5, and vagrant. They mainly revolve around the different tools, package managers and editors that I use. One of my favorites in the list is last-working-dir which basically just opens your terminal to your last working directory when opening a new tab or window.

Adding plugins is fairly easy you just need to add the name of the plugin to the OHMyZSH plugins list in your .zshrc. When OHMyZSH is installed it will add a bit of configuration to your .zshrc. You just need to find the `plugins=()` section and edit the list. The following example will add git, brew and Composer.
```bash
# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git brew Composer)
```

## OHMyZSH Themes
OHMyZSH comes preinstalled with many themes you can see the [full list here](https://github.com/robbyrussell/oh-my-zsh/wiki/themes). You can even create your own themes if you like. It is pretty simple but it does take some shell scripting to complete.  I would suggest finding a them you like and possibly customizing it to your needs.
