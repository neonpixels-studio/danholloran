---
extends: _layouts.post
section: content
title:  Vue.js Component Messaging
date: 2015-12-7
categories: []
published: true
---

The other day I was working through how to abstract an alert list into its own component. Basically it is an `ul` where each alert is a `li` pretty simple. So using Vue.js, [Browserify](http://browserify.org/), and [Vueify](https://github.com/vuejs/vueify) this is pretty simple but the problem was how do the other components add alerts. I may be missing something however, it does not seem like Vue.js. offers any sort of component to component event system. Well, at least outside of a parent child relationship which I did not want to go that route since multiple components may need to dispatch alerts.

**Note:** This will be more of a high level exercise than a post you can directly copy code from. Many pieces will be missing for brevity and I will assume you have at least used Vue.js a little.

So my solution currently is to send an event to the main Vue.js instance that controls all the components. This event is dispatched from the component that wants to add alert. Then I can pass the message along to the Alert component using [component properties](http://vuejs.org/guide/components.html#Passing_Data_with_Props). Finally I can handle anything I need to do when the value updates using [computed properties](http://vuejs.org/api/#computed). I honestly do not feel this is the correct approach but it works I will outline another idea below I may implement. I do believe that outlining the whole thought process may be helpful.

So basically there is a List component that I want to be able to add alerts from without it having to know about the Alert component. So firing off an event seems like the way to do it right? The following is the important parts of the list component.

```javascript
// The message details.
var message = {
	'This is the message value', // Value
	'success', // Status
	4000 // Timeout
};

// This will be fired at some point when something happens in the list.
// Such as an item was removed successfully.
this.$dispatch('add-alert-message', message );
```

The `this.$dispatch` sends an event up the parent chain you can learn more about component events [here](http://vuejs.org/guide/components.html#Custom_Events). However, there does not seem to be a way to subscribe to this event from another component. The next step happens in the main Vue.js instance where you can subscribe to the event and then apply it to a messages array on the Vue.js data object. You can also do something like check for duplicates at this level as well this could also be handled in the computed properties section as well. Which kind of feels weird since the Alert component should be in charge of what consists as a duplicate alert.

```javascript
// The main Vue.js Instance.
new Vue( {
    el         : '#app',
    data       : { messages : [] },
    events     : {
        'add-alert-message' : function( message ) {
            // Check for duplicates and anything else you need to do.
            this.messages.push(message);
        }
    }
} );
```

So this works and all however you now have to let the alert component know about `this.messages` which you can do by passing messages to the alert component. The following snippet binds the Vue.js messages to the Alert component messages property. Using the `.sync` modifier will allow the values to sync from the Vue.js instance to the Alert component.

```html
<alert :messages.sync="messages"></alert>
```

Then you will need to use computed properties on the alert component since you need to know when it is updated. So far I have not found a better way to handle this. I needed to be able to set a timeout so the messages would disappear after a short time. You could handle this in the main Vue.js instance but that would kind of defeat the point of a component.

```javascript
// Alert component configuration.
{
    methods : {
        setAlertMessagesTimeout = function() {
            // This will go through the alerts and set a timeout so the alerts can automatically be removed.
        }
    },
    props   : ['messages'],
    computed : {
    alertMessages : {
        get : function() {
            this.setAlertMessagesTimeout();
            return this.messages;
        },
        set : function() {
            this.alertMessages = this.messages;
        }
    }
}
```

No finally you can loop over the alerts and output them in the Alert components.

```html
<ul v-for="message in alertMessages">
    <li class="alert alert-{message.status}">{message.value}</li>
</ul>
```

So it almost seems like there should be a better way... I have considered firing an event off of the body or whatever element that is used for the Vue.js instance. This way you could easily pass messages between components. You could have 2 helper functions one that handles firing the event so you will not have to worry about it and one that subscribes to the event. This would basically bypass the main Vue.js instance having to know about what the components are doing.

```javascript
// In component 1
componentFireEvent('event-name', 'event-details');

// In component 2
componentSubscribe('event-name', function( eventDetails ) {
	// Do whatever you need to do now.
});
```

Using some sort of abstraction like this would help you not have to remember what element you are firing the event on each time. I may refactor and flesh this thought out more as I learn. Maybe there is an even better way to handle it that I have not thought of. I also may have missed something in the documentation that solves this. Maybe I am trying to force a square peg into a round hole and there is a good reason why it is the way it is. I may never know...
