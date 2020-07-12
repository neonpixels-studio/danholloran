---
extends: _layouts.post
section: content
title:  "Introducing Press CLI: A Configurable WordPress Installer"
date: 2016-10-30
categories: []
alert_message: This project is no longer maintained.
published: false
---
So I have been wanting to build a WordPress installer for a while now. It is a lot of effort setting up multiple WordPress installs in the same basic configuration to start a project. I admit it I am extremely lazy but thats okay. I also wanted an excuse to build something with the Symfony Console component which makes building a CLI tool fairly easy.

I like using WP CLI to do tasks to help speed it up but it has a large amount of commands to remember. Along with having to enter things like database credentials each time that never change. So I figured I would create Press CLI to add configuration and automatically run WP CLI commands along with custom commands if you like. Paired with [Laravel Valet](https://laravel.com/docs/valet) you will not even have to setup the .dev domain it is all setup automagically from the project name.

You should spend your time building awesome things not running 15 commands or going through the same old 5 minute install. The three things I really want to add to finish my vision would be to automatically connect/initialize a Git repository, fully install paid plugins with serial number and almost automatically migrate a live database using WP Migrate DB Pro so you do not have to worry about it. In that time you could grab a cup of coffee or start laying out what needs to be built.

However, enough about why and lets get to the how you can learn more about Press CLI. Check out ~~[https://pressc.li/](https://pressc.li/)~~ to get information on requirements, installation and how to use Press CLI. I plan on trying to get some screen casts of the available commands in case you are a more visual learner. Check out the project on [Github](https://github.com/dholloran/press-cli) to read the code, file an issue or request features.
