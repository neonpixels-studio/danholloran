---
extends: _layouts.post
section: content
title:  Laravel and WebSockets
date: 2016-03-25
categories: []
published: true
---

Working with WebSockets and Larvel is extremely easy! If you are new to Laravel it has an event system that you can use to dispatch events for other parts of your PHP code to use. As well as Laravel supports Redis and [Pusher](https://pusher.com/) for dispatching events via WebSockets. Pusher is a fully hosted service that will handle the Node.js side of things for you. I hover will cover using Laravel events with Redis to broadcast events to [Socket.io](http://socket.io/) and using [Supervisor](http://supervisord.org/) to keep all the processes needed running by default. The current version of Laravel as of this writing is 5.2 which you should already have installed and I will be assuming you are using Laravel Homstead.

## Dependencies and Configuration
So lets get started with installing the required dependencies.
```bash
$ composer require predis/predis
$ npm install express ioredis socket.io --save
```

We will then need to update our `.env` with `BROADCAST_DRIVER=redis`.

## Event Class
Now we will need to create a new event.
```bash
$ php artisan make:event EventName
```

Go ahead open the new event `app/Events/EventName.php`.

You need to make sure that your event `implements ShouldBroadcast` by default it does not.
```php
<?php
// ...
class EventName extends Event implements ShouldBroadcast
// ...
```

For this example we will use a `$data` property to pass information to socket.io however by default you will have access to any public property.
```php
<?php
// ...
public $data;
// ...
public function __construct($some_data)
{
    $this->data = compact('some_data');
}
// ...
```
Then you will need to set the channel you are going to broadcast the events on. We will use this later with Socket.io to listen for the events.
```php
<?php
// ...
public function broadcastOn()
{
    return ['event-example'];
}
// ...
```
Our whole event class should now look like this.
```php
<?php

namespace App\Events;

use App\Events\Event;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class EventName extends Event implements ShouldBroadcast
{
    use SerializesModels;

    public $data;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct($some_data)
    {
        $this->data = compact('some_data');
    }

    /**
     * Get the channels the event should be broadcast on.
     *
     * @return array
     */
    public function broadcastOn()
    {
        return ['event-example'];
    }
}
```

## Socket.io
Now we will need to make a `socket.js` file in the root of our Laravel installation and place the following into it.

```javascript
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Redis = require('ioredis');
var redis = new Redis();
redis.subscribe('event-example', function(err, count) {
});
redis.on('message', function(channel, message) {
    console.log('Message Recieved: ' + message);
    message = JSON.parse(message);
    io.emit(channel + ':' + message.event, message.data);
});
http.listen(3000, function(){
    console.log('Listening on Port 3000');
});
```

If you want to update the channel you will need to change `event-example` in `redis.subscribe('event-example', function(err, count) {
});`.

Now we are ready to run the `socket.js` file and Redis in **separate tabs on your server** run the following.
```bash
$ node socket.js
# You should see Listening on Port 3000
$ redis-server --port 3001
# You should see a whole bunch of output
```

## Event listener
Now for simplicity you can add the following to your main view template. This basically listens for an event on the `event-example` we have setup that as fired by the `EventName` class. You will want to move this into is own separate JS file.
```javascript
<script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
<script>
var socketURL = 'http://192.168.10.10:3000'; // 192.168.10.10 can be replaced with the IP address of your server.

// If you are using Elixir/Browserify use commented out socket instead.
var socket = io(socketURL);
// var socket = require('socket.io-client')(socketURL);

// The event name is created by the event channel (example-event) we set earlier
// and the class name with the full namespace (App\Events\EventName).
socket.on('event-example:App\\Events\\EventName', function (event) {
    alert(event.data.some_data);
});
</script>
```

## Event testing
For simplicity sake when testing we can just add a route to fire the event. In reality this will happen elsewhere possibly in a controller. The main thing to take away is `Event::fire(new EventName('Some data about the event.'));` will be how you can fire the event.
```php
Route::group(['middleware' => 'web'], function () {
    Route::get('/fire', function () {
        Event::fire(new EventName('Event data'));

        return 'Event Fired';
    });
});
```

Now if you open your site in one tab and go to `/fire` in the other. Then in the first tab you should see an alert with the text `Event data`. Now you have a fully functional setup with Laravel and WebSockets!

## Supervisor
So obviously we do not want to manually run `node socket.js` and `redis-server --port 3001` when we start our server. As well as make sure both commands are never closed out. So this is where [Supervisor](http://supervisord.org/) comes into play. It will handle starting both services and making sure they stay up continuously.

**The following instructions will happen on your server.**

If you do not already have Supervisor installed you can install it via `sudo apt-get install supervisor`. Then you will need to restart Supervisor via `sudo service supervisor restart`

Now we need to set the configuration file for `socket.js`	via `sudo nano /etc/supervisor/conf.d/socket.conf`.
```bash
# socket.conf content
[program:socket]
command=node /path/to/install/socket.js # IMPOTANT: Update /path/to/install
autostart=true
autorestart=true
stderr_logfile=/var/log/socket.err.log
stdout_logfile=/var/log/socket.out.log
```

Then we will need to setup the configuration for Redis `sudo nano /etc/supervisor/conf.d/redis.conf`
```bash
# redis.conf content
[program:redis]
command=redis-server --port 3001
autostart=true
autorestart=true
stderr_logfile=/var/log/redis.err.log
stdout_logfile=/var/log/redis.out.log
```

Now we need to tell Supervisor about our new configuration.
```bash
$ sudo supervisorctl reread
$ sudo supervisorctl update
```

You can verify everything went ok by the following
```bash
$ tail /var/log/socket.out.log
# You should see Listening on Port 3000
$ tail /var/log/redis.out.log
# You should see a whole bunch of output
```

If something does not seem to work correctly you can check the error logs via the following.
```bash
$ tail /var/log/socket.err.log
$ tail /var/log/redis.err.log
```

So thats all there basically is now go out and build something awesome!
