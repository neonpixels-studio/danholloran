---
extends: _layouts.post
section: content
title:  Visual Management System - PAi
date: 2017-03-17
categories: [Laravel,Vue.js,Web Sockets]
cover_image: /assets/img/pai-vms.png
thumbnail_image: /assets/img/pai-vms-thumbnail.png
public: false
draft: true
built_at: "Matchbox Design Group"
---
The Visual Management System (for PAi) is a board used for scheduling a printing production floor. I was responsible for building out the majority of the application. I built it using Laravel and Vue.js. It uses [web sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) to automatically update all instances of the board in real-time. I also built an importer that allows an export from their order management system to add new jobs.
