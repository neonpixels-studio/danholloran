---
extends: _layouts.post
section: content
title:  Sync Google Tasks With IFTTT
date: 2016-12-17
categories: [laravel]
alert_message: This project is no longer online or maintained.
published: false
---
So I recently purchased an Amazon Echo and I wanted to be able to add todos to my list via my voice. However the built in task manager is extremely simple and I did not have any interest in the two options that can directly integrate with Echo. So I needed to find a better solution.

I currently use [gTasks](http://www.katans.com/) for tracking my tasks which uses Google Tasks to sync the tasks. However, I could not find a good way to get Alexa and Google Tasks to work together.

So I decided to build my own solution using the [IFTTT Maker Channel](https://ifttt.com/maker). This way not only can it work with Amazon Alexa but any task service that you use that supports IFTTT, along with anything that can send a JSON web request. Such as iOS Reminders so you can add tasks via Siri that easily sync with Google Tasks using the Reminders IFTTT Channel.

You can register to sync your todos with Google Tasks at ~~[https://sync.danholloran.me/register](https://sync.danholloran.me/register)~~. Feel free to let me know if you find any issues or have suggestions to make it better.
