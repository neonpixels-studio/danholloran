---
extends: _layouts.post
section: content
title:  Quickly Install Applications on Your Mac With Homebrew and Cask
date: 2016-01-12
categories: []
published: true
---

  I have been having some issues with my work Macbook and I needed to reinstall Mac OS X. I like to do a complete restore every so often any way since I like to hack and play with things so there is quite a bit of junk that accumulates. I figured this time I would document some of the helpful things you can do with a few tools and a little scripting.

I figured I would cover [Homebrew](http://brew.sh/) and [Cask](http://caskroom.io/) to quickly install common applications first. Usually it allows me to install the majority of the applications outside of the Mac App Store. The applications in then Mac App Store can be quickly installed in my purchased applications sections.

I suggest to go install at least Xcode and accept the developer agreement via the command line `$ sudo xcodebuild -license`. You may want to manually install whatever code editor you use since we will need to edit a few files. While your at it you could go ahead and install all of your Mac App Store applications thats what I would do. Then you will need to install Homebrew you can find the instructions on their [site](http://brew.sh/). Then you can install Cask via the instructions on their [site](http://caskroom.io/). Now we are ready to get installing.

What I suggest to do once you have everything installed is to run `$ brew cask search > cask-install.sh` on your desktop or somewhere else you want to create a file. This way you can easily go through the list of possible applications and choose which ones you want. Then with a little bit of editing we can just execute the file to install all of the applications you need. You could also save this file somewhere like Dropbox or if you want to version it with git on Github.

If you only have a few applications you want to install you can search for individual applications with `$brew cask search <application>` it uses fuzzy searching so it will retrieve close matches. Then you can just install them individually with `brew cask install <application>`. You can also copy the results you want into a `cask-install.sh` just like above. This way you can save the applications to install and bulk install the applications.

Once you have all the applications you want to install added to `cask-install.sh` you will need to add `brew cask install` before each application name and a semicolon `;` after each application name. I find that using an editor such as Sublime Text with multi-selection makes this a breeze. Then you will want to execute `chmod +x cask-install.sh` in the terminal this will allow you to execute the file. Then all you have to do is execute the installation via `./cask-install.sh`.

Once the installation has completed all that is left to do is to configure each application. I tend to do this as I use them short of a handful that I use on a daily basis. Now you can store this file somewhere  and you can use it next time you need to install multiple applications.
