---
extends: _layouts.post
section: content
title:  Laravel Forge, Digital Ocean and WebSockets
date: 2016-03-05
categories: []
published: true
---
I recently posted an overview of how to setup Web Sockets using [Laravel and Socket.io](/2016/01/30/laravel-and-websockets/). I wanted to follow it up with a quick post on how to get the Web Sockets functioning correctly on a [Digital Ocean](https://www.digitalocean.com/) server using [Laravel Forge](https://forge.laravel.com/). I a going to assume that you have already gone through the setup process to provision a new server. Also that you have read the first post since the largest amount of work will lie there. I believe these steps should be identically for all hosting providers not Just Digital Ocean but do not quote me on that.

First of all we need to setup some daemons for Redis and Socket.io which forge makes extremely simple. This will allow Redis and Socket.io to run continuously without you having to worry about it, First you need to navigate to Servers > Your Server and then the "Daemons" tab. You will need to add `redis-server --port 3001` in the "Command" text field and click the "Start Daemon" button this will enable Redis. You will also need to add `node /home/forge/mysite.com/socket.js`, make sure to update `mysite.com` with the domain of you site, in the "Command" text field and click the "Start Daemon" button this will enable Socket.io.

You can check on your daemons at any time by clicking on the eye icon in the "Status" column. You will want to make sure that both Redis and Socket.io are running. If you have any issues it is best to SSH onto your server and try running the commands manually to see make sure they are successful. HJst make sure to delete the daemon before you SSH onto your server.

Next we will want to move onto the "Network" tab were we can open port 3000 in the servers firewall so we can access Socket.io. You can set the "Name" to SocketIO, the "Port" to 3000 and I suggest adding the IP Address of your server but thats up to you. Then you just click the "Add Rule" button and you should be good to go. You can test the connection by navigating to http://mysite.com:3000 you should see the message "Cannot GET /". If you see that everything should be working just fine.
