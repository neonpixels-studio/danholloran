---
extends: _layouts.post
section: content
title:  Vue.js Component Messaging Continued
date: 2015-12-8
categories: []
published: true
---

So yesterday I posted about Vue.js component messaging. This is in a way a continuation so you will want to read that first "[Vue.js Component Messaging](/2015/12/07/vues-js-component-messaging/)".

I had suggested that firing an event off of a common element wether that is the body or the main Vue.js instance really does not matter. However I kind of got to thinking more about it and that would work but there may be a problem if there are multiple instances of the same component on the same page. In the example of an Alert component if for some reason there was one Alert component in the header and one in the footer an alert message would be added to both.

I did have an idea I thought may solve that issue allow for something like an event component property. Wether you pass it the full value or maybe just a suffix. It could be `event-name` by default and if you pass it `event-name-2` then that event would fire while passing the same data as `event-name`. As a suffix maybe you could pass `my-custom-suffix` and then the event that would be fired would be something like `event-name/my-custom-suffix`.

```html
// Full event
<alert
	:messages.sync="messages"
	:event="event-name-2"
></alert>

// Event suffix
<alert
	:messages.sync="messages"
	:event-suffix="event-name-2"
></alert>
```

Then you could listen for the event following the example I used in the previous post using the proposed helper functions. Feel free to listen to these events however since there is nothing magical happening here.

```javascript
// In component 1 (full event)
componentFireEvent('event-name-2', 'event-details');

// In component 2 (full event)
// this.even = 'event-name-2'
componentSubscribe(this.event, function( eventDetails ) {
	// Do whatever you need to do now.
});

// In component 1 (event suffix)
componentFireEvent('event-name-2', 'event-details');

// In component 2 (event suffix)
// this.even = 'event-name-2'
componentSubscribe('event-name/' + this.event, function( eventDetails ) {
	// Do whatever you need to do now.
});
```

So you may want to be a little more descriptive when naming your properties however, this basically outlines how it could work. Then in the case of the Alert I am using I wouldn't need the property since there really shouldn't be more than one on a page. However this use case may evolve and then I could use this strategy.

After all this I still cannot shake the feeling I am missing something. That there is some where that this problem has been solved. Maybe it has been solved in another Javascript framework like Vue.js. Still I think this is a pretty solid solution and short of making sure you document the possibilities for the event names. That should be easy your a developer you document everything with amazing precision right...right?

I could possibly envision a situation where your component has more than a few events and this may not scale really well. However, in that situation it may be more of an issue with how the component is built. This is definitely an interesting problem I have never encountered before.
