---
extends: _layouts.post
section: content
title:  Laracon Online 2019 Notes and Thoughts
date: 2019-03-07
categories: []
published: true
---

These are my notes from Laracon 2019 was an interesting conference and a lot of fun. I think you may still be able to buy tickets to access the recordings at [https://laracon.net/](https://laracon.net/). It is nice being online not having to travel makes it easier to go.

## Getting started with event sourcing in Laravel

- Freek Van der Herten [@freekmurze](https://twitter.com/freekmurze)
- **Slides:** [https://speakerdeck.com/freekmurze/event-sourcing-laracon-online](https://speakerdeck.com/freekmurze/event-sourcing-laracon-online)
- Application fires events when data changes and those are logged
- Good for auditing, issue recreation and reporting
- [https://github.com/spatie/laravel-event-projector](https://github.com/spatie/laravel-event-projector)
- [https://github.com/spatie/laravel-eventsauce](https://github.com/spatie/laravel-eventsauce)

## Writing less complex, more readable code

- Jason McCreary [@gonedark](https://twitter.com/gonedark)
- Code quality level how many WTFs per minute
- Martin Fowler - Refactoring

### Guidelines for good code

- Formatting
    - Consitency matters
    - Choose it, automate it and forget it
    - Use community standard if possible
    - [https://styleci.io/](https://styleci.io/)
- **Dead code**
    - Why is it here and why is it not used
    - Commented code just remove it
    - Unused variables
    - Boy Scouting - Leave it better than you found it
    - Unreachable code may be harder to see in larger blocks
    - Unnecessary syntax. Such as a switch with just returns break is not needed and never for default
    - Flagged code some sort of state such as promotion or coupon code
    - If you encounter it remove it
    - Make sure primary action is at top level. Helpful to early return aka guard clause
- **Nested Code**
    - Avoid else where possible
    - Avoid nested code
- **Using objects**
    - Pass objects of grouped date (data clump) if possible over simple types (int,string,etc.)
        - Use value objects basically a class with private props and getters no setters allows it to be immutable
    - Allows for adding methods to abstract complex logic
    - Options array are abused in PHP and do not have a specific structure makes it untidy hard to know all options
    - Use enums to reduce options to allowed values.
- **Big blocks**
    - Leverage framework when possible
        - Validation → form request
        - Model look up → implicit model binding
    - For top level methods such as a controller try to make as simple as possible
- **Naming**
    - Two hardest things in programming naming, cache invalidation and off by 1 errors
    - don't be a special snowflake use language conventions
    - Foreach use plural and singular make it specific to context
    - No need to over abbreviate
    - Try to relay human aspects `$str_error` → `$error_message`
    - Start with technical name and allow time to come up with something better
    - Use a thesaurus
- **Removing comments**

    ![](/assets/img/Screen_Shot_2019-03-06_at_9-87b13d24-c7bc-46e0-942a-0cb52028f0c8.33.23_AM.png)

    - Misleading comments are confusing
    - Comments can be skipped over
    - Attempt to improve the code over comments
    - Doc Blocks ≠ Comments they server documentation purposes
    - Look for inline comments that explain exactly what the code is doing such as `// date for yesterday`
    - Proximity rule take variables closer to where they are being used makes it easier to tie it together
    - If comment is relaying why this are still important
- **Reasonable returns**
    - Return something other than `null`
    - Possibly return a mock or null object that behaves like the real object
        - `User` → `GuestUser`
- **Rule of three**
    - Wait until ~3 duplications before abstracting to avoid over engineering
    - Helps you find the correct solution
    - Make sure names align.
- **Symetry**
    - Naming and thinks like keeping methods with methods
    - Keep object access level consistent
    - Keep not checks the same

## Realtime applications with Laravel

- Marcel Pociot [@marcelpociot](https://twitter.com/marcelpociot)
- AJAX polling approach sending a request a second or so. Not best fit for realtime application such as chat
- AJAX long polling attempts to keep the request open as long as possible until it times out then client sends a request again. Better than sending a request a second but could be better.
- Websockets permanent connection between client and server

    ![](/assets/img/Screen_Shot_2019-03-06_at_10-deb3a3a1-6955-44bb-94ee-8bd344af3a73.10.05_AM.png)

    - Can be text or binary data
    - [All major browsers support except for Opera mini](https://caniuse.com/#search=websockets)
    - Instant message sending
    - [Ratchet PHP websockets in PHP](http://socketo.me/)
    - [Laravel echo server](https://github.com/tlaverdure/laravel-echo-server)
    - [Laravel WebSockets](https://github.com/beyondcode/laravel-websockets) [Pusher](https://pusher.com/) replacement works with [Laravel Echo](https://github.com/laravel/echo). Does not rely on node.js
        - Pitfalls
            - Ulimit unix file limit default is 1000 concurrent connections
            - Event Loop is limited to 1000 connections as well
            - [Fixes exist here](https://docs.beyondco.de/laravel-websockets/1.0/faq/deploying.html)
        - [https://murze.be/introducing-laravel-websockets-an-easy-to-use-websocket-server-implemented-in-php](https://murze.be/introducing-laravel-websockets-an-easy-to-use-websocket-server-implemented-in-php)

## What's New in React

- Wes Bos [@wesbos](https://twitter.com/wesbos) ‏
- **Slides:** [https://wesbos.github.io/Whats-New-In-React/#1](https://wesbos.github.io/Whats-New-In-React/#1)
- Context API
    - React context allows you to pas data down multiple levels the need to pass through props at each level
    - Prop drilling passing props down through multiple components
    - Allows for injecting a consumer into a component one solution for global shared data
    - It relies on a parent provider component
    - Good for medium sized applications
- Fragements
    - Fixes extra `<div>`s since you can not have more than one html element in a component.
    - Fixes descendent selectors since you do not need a wrapping `<div>`
    - Does Vue have a solution for this?
        - Not built in but [Vue Fragments](https://github.com/y-nk/vue-fragment) exists
- Error boundaries
    - Handles not being able to `try`/`catch` in JSX
- Refs
    - Escape hatch for getting DOM elements. Seems to be like Vue.js `this.$refs`
    - Helpful for wrapping older plugins/code
- Portals
    - Useful for modals and what not
    - Somewhat like a built in version of [Portal Vue](https://linusborg.github.io/portal-vue/#/)
    - Can be used to handle tags out side of the React root element
- Suspense (Coming Soon)
    - Waiting for things to load before rendering
    - Helps with code splitting, data fetching and images
    - Decouples loading ui from components
    - Minimizes loaders on faster connections
- Hooks
    - New way to write state and other things without classes

## Exploring Laravel 5.8

- Taylor Otwell [@taylorotwell](https://twitter.com/taylorotwell)
- hasOneThrough relationship
    - Basically handles accessing has one relationship has one relationship `$supplier→account→history` to `$supplier→accountHistory`
- Auto discovering of model policies
- Supports hashing API tokens with sha256 for simple API authentication without using Laravel Passport. Basically for Bearer Token API instead of oAuth.
- Pivot models dispatch model events
    - Not new but custom pivot models are pretty cool
- Default scheduler timezone
- Artisan in code simplification can pass like you would on the command line
- Testing mock helpers cleans up mocking then replacing in the container
- `orWhere()` higher order function helps remove callbacks on `orWhere` scopes.
- [Atomic lock](https://laravel.com/docs/5.8/cache#atomic-locks) process running longer than requested fixed
- Artisan serve adds port scanning to allow for multiple instances
- Improvements to Redis blocking pop allows pinging of Redis block time. Still allows queues to be processed quickly

## Laravel, the Blockchain, and You!

- Samantha Geitz [@SamanthaGeitz](https://twitter.com/SamanthaGeitz)
- **Slides:** [https://speakerdeck.com/samanthamichele7/laravel-the-blockchain-and-you](https://speakerdeck.com/samanthamichele7/laravel-the-blockchain-and-you)
- Should i use blockchain probably not unless you are solving a specific problem
- Blockchain is decentralized multiple servers with entire copy of database
- Add new blocks that shows how the data should change
- Somewhat like Git more in the way the changes are tracked

    ![](/assets/img/Screen_Shot_2019-03-06_at_1-2ef938be-cde4-4d9b-809c-a5fa9124bed3.40.57_PM.png)

    - It is slow and comparatively expensive then a MySQL database
    - If you cant do it on a smartphone from 1999 probably shouldn't do it
    - Helps solve currency forging and other issues
    - You can buy or "mine" them
    - Needs a private key and public to access much like SSH Keys
    - Mining incentivizes integrity of the network
    - [Ethereum](https://www.ethereum.org/) is meant to build decentralized apps and built in JavaScript
        - Used to solve Xbox game publisher royalties
            - Went from ~45 days to almost immediately
            - Reduced publishers cost 99% and cut Microsofts in half
        - [Webjet](https://www.webjet.com.au/) a travel company
            - Problem is double booking/disputes about 5% annually
    - Possible good use cases
        - Voting app
        - DRM management of video/games
        - Verifying identity of participants is important financial, legal, doctor
    - Bad use cases
        - Most things
        - Data is in constant flux
        - If you want ability to add/edit records
        - Speed/performance important
    - Tools
        - [web3.js](https://web3js.readthedocs.io/en/1.0/) main for Etherum
        - Nothing really for PHP
        - [Truffle Framework](https://truffleframework.com/)
            - [Ganache](https://truffleframework.com/ganache)
            - [Drizzle](https://truffleframework.com/drizzle)
        - [https://coinpress.cc/](https://coinpress.cc/)

## Databases in space

- Matt Stauffer [@stauffermatt](https://twitter.com/stauffermatt)
- **Slides:** [https://speakerdeck.com/mattstauffer/databases-in-space](https://speakerdeck.com/mattstauffer/databases-in-space)
- This is one that is really interesting and I may want to dig more in it in the future but now its more fun to just listen
- Example [https://github.com/mattstauffer/alberts-avocado-toast](https://github.com/mattstauffer/alberts-avocado-toast)
- [Laravel Friends GeoCodio](https://www.geocod.io/)
- [Google Maps Platform](https://developers.google.com/maps/documentation/)
- [MySQL spatial types](https://dev.mysql.com/doc/refman/5.7/en/spatial-type-overview.html)
- [Algolia (scotch.io)](https://scotch.io/tutorials/achieving-geo-search-with-laravel-scout-and-algolia)
- [Intro Tutorials](https://medium.com/@brice_hartmann/getting-started-with-geospatial-data-in-laravel-94502dc74d55)
- [Laravel MySQL Spatial](https://github.com/grimzy/laravel-mysql-spatial)
- [Laravel Postgis](https://github.com/njbarrett/laravel-postgis)

## Practical Solutions to Common UI Design Problems

- Steve Schoger [@steveschoger](https://twitter.com/steveschoger)
- **Slides:**
- [https://www.figma.com/](https://www.figma.com/) - In browser design tool
- [https://duotone.shapefactory.co/](https://duotone.shapefactory.co/) - Tool for transforming images
- [https://unsplash.com/](https://unsplash.com/) - Nice images
- Design inspiration
    - [https://land-book.com/](https://land-book.com/)
    - [https://www.siteinspire.com/](https://www.siteinspire.com/)
    - [https://dribbble.com/](https://dribbble.com/)
- Don't use grey text on colored backgrounds
- Use perceived brightness
- Start with too much whitespace
    - Use input length as an affordance show how much is expected to be input
- Balance weight and contrast
- Supercharge the defaults
- Create depth with color
- `font-feature-settings: "tnum";` behaves like a monospaced font to align characters
- This talk really needs to be watched
- [https://www.heropatterns.com/](https://www.heropatterns.com/)
- Use good fonts
- Interesting mobile table solution convert it to accordions. This would be semi-annoying in PHP/Blade but super easy in Vue.js

    ![](/assets/img/Screen_Shot_2019-03-06_at_4-1916ca15-81cf-4ad6-8acd-ed14be54bee4.28.54_PM.png)

## Tailwind CSS by Example

- Adam Wathan [@adamwathan](https://twitter.com/adamwathan)
- **Slides:**
- [https://tailwindcss.com/docs/what-is-tailwind](https://tailwindcss.com/docs/what-is-tailwind)
- Live coding not really much to note it really needs to be watched
