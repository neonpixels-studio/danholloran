---
extends: _layouts.post
section: content
title:  Setting Up Your Shell
date: 2015-09-29
categories: []
published: true
---

So you want to setup your shell thats awesome! This will be primarily relevant to Mac OS X since if your on Linux you should already be comfortable with the shell and if your on Windows I'm sorry even though Windows 10 does look pretty cool. I will go through some basic configuration of iTerm 2 and get zshell setup.

First of all Mac OS X terminal is fairly barebones it works in a pinch but I like something a little more customizable. So I prefer [iTerm 2](https://www.iterm2.com/) I will be using it for the duration of this post. So go ahead and download it and install it I'll be here waiting. Once iTerm downloads go ahead and install it.

One of the biggest pain points I think when you get started using the CLI is landing at a blinking cursor and are not sure where to go from there. So I believe it helps to customize your terminal so it is a little more inviting. Also it will help you be more efficient when using your terminal.


### iTerm 2 Customizations
iTerm 2 has the ability for a large amount of customization through the preferences. One of the main highlights is the ease of altering your color scheme. Much like your editor you can find iTerm 2 color schemes or you can make your own. You can find the color scheme editor under `Preferences > Profile > Colors`. There you can either tweak the colors or import a color scheme from the Load Presets... drop down. You can find new color schemes on the [iTerm 2 Color Schemes](http://iterm2colorschemes.com/) or possibly the creator of your code editors theme also has a scheme created for iTerm 2.

A few other top Preferences to check out would be `Preferences > Profile > Text` where you can set a custom terminal font, edit the way the cursor looks and tweak how the text is rendered. Under `Preferences > Profile > Window` you can tweak how the terminal window is displayed you can set a custom background, set the opacity of the background and more. You can enable notifications under `Preferences > Profile > Terminal`. There are many more customizations under `Preferences` that you can tweak to get your terminal just right.

### Enable zshell
Zshell is a shell much like the default bash shell that is set by default in Mac OS X. A shell is basically the environment that you execute commands. It adds tools to allow you to accomplish your tasks. The default bash shell is good but zshell in my opinion is better bash especially when paired with [OHMyZSH](http://ohmyz.sh/). Changing your default shell to zshell is easy just paste the following into your terminal `chsh -s $(which zsh)`. Then you will need to open a new tab in iTerm 2 with `cmd+t` so the change will take effect. Then you can paste `echo $SHELL` into your terminal and you should see `/bin/zsh`. That is all you need to do.

### Wrapping Up
We now have iTerm 2 setup with zshell enabled. Next we will ned to setup OHMyZSH and learn about the .zshrc configuration files.
