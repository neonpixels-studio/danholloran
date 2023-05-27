---
extends: _layouts.post
section: content
title:  St Louis WordCamp 2016
date: 2016-05-16
categories: []
published: true
---

WordCamp St. Louis was held this year again at Washington University St. Louis on May 14-15 2016. Over all it was a good time I always enjoy going to WordCamps. I figured I would post my notes here [like I did last year](http://danholloran.me/2015/03/15/st-louis-wordcamp-2015/) just cause. I have added the slides that where available as of this posting you can checkout the full listing [here](https://2016.stlouis.wordcamp.org/2016/05/16/speaker-slides-round-up/). Some of the later notes on Saturday kind of trailed off because I decided to fix my blog after a few issues with Github Pages and Jekyll 3. One of the downfalls to Jekyll being so easy to write with being Markdown at its core and all makes it sometimes difficult to upgrade.

## Saturday May 14, 2016

### Plugin development 101
- [Slides](http://whoischris.com/slides/plugin-dev-101.pdf)
- [Primary Vagrant](https://github.com/ChrisWiegman/Primary-Vagrant) - Apache VVV
- Brand plugin it's important
- Escape all data
- [WP Crowd Podcast & Blog](http://www.thewpcrowd.com/)
- Network activation does not fire the uninstall hooks???
- Check out [Ship](http://ship.getherbert.com/) trigger Git to SVN
- Check out [WP Pusher](https://wppusher.com/)
- [AppNotch](http://www.appnotch.com/) - Make an application from a WordPress page
- Check out Advanced WordPress Facebook group

### Optimizing Your Themes for Responsive Images in WordPress
- Use cases [responsive.images.org](http://responsive.images.org)
- srcset & &lt;picture&gt;
- srcset X descriptors - 1x, 2x, 3x, etc. pixel density
- srcset W descriptors - width defaults to full width of viewport
- [Picturefill polyfill](https://scottjehl.github.io/picturefill/)
- [Responsive Images 101](http://blog.cloudfour.com/responsive-images-101-definitions/) (Cloud Four Blog)
- Only works on same aspect ratio sizes (soft crops)
- `wp_calculate_image_sizes` filter size attributes ([docs](https://developer.wordpress.org/reference/functions/wp_calculate_image_sizes/))
- 2016 theme checkout as an example
- [Smashing Magazine - Responsive Images in WordPress](https://www.smashingmagazine.com/2015/12/responsive-images-in-wordpress-core/)

### React.js Powered Themes
- [https://github.com/kipraske/kraske-react-2016](https://github.com/kipraske/kraske-react-2016)
- [React Native](https://facebook.github.io/react-native/)
- [WP Calypso](https://developer.wordpress.com/calypso/)
- Virtual DOM & 1 way data flow
- Props components shouldn't notify
- State components can modify
- [Isomorphic JS](http://isomorphic.net/) to render on the server
- Routing [Page on NPM](https://www.npmjs.com/package/page)
- [Automattic Picard](https://github.com/Automattic/Picard)
### The Future of WordPress: Five Years Out
- Your expectations are too high for 1 year and too low for 5 years
- You need a life and hobbies it helps you find problems to solve
- WordPress managed and owned by community
- Everyone can contribute

### WordPress Query Optimization and Best Practices
- `update_post_meta => false` Primes the post meta cache
- Only disable `update_post_meta` when you are sure that no post meta will be used
- `wp_cache_set` ([docs](https://codex.wordpress.org/Function_Reference/wp_cache_set)) and `wp_cache_get`([docs](https://codex.wordpress.org/Function_Reference/wp_cache_get)) caching for a single request cycle
- [Transients](https://codex.wordpress.org/Transients_API) can be used for persistent caching

### Code Review: Keeping Things Secure, Clean, and Performant
- [Slides](http://www.slideshare.net/ryanmarkel/ryan-markel-wordcamp-stl-2016-code-review)
- Why? Helps your code be safe, scalable, readable, and learning
- [WP Enforcer](https://github.com/stevegrunwell/wp-enforcer)
- [VIP Quickstart](https://vip.wordpress.com/documentation/vip/quickstart/) - Vagrant
- Use pull requests for code review
- Diff reviews can work too
- Make part of your culture
- **NEVER** skip code review

### Struck By Lightning
- G.R.I.P.I. (Goals.Roles.Information.Process.Interpersonal)
- Favorite Tools:
	- [Rescue Time](https://www.rescuetime.com/)
	- CLI grep history
	- dotfiles
	- Grunt
	- [QUint](https://qunitjs.com/)
	- [DotJS](https://github.com/defunkt/dotjs)
	- [PhantomJS](http://phantomjs.org/)
	- [JSHint](http://jshint.com/)/[ESLint](http://eslint.org/)
	- [Vagrant](https://www.vagrantup.com/)
	- [Puppet](https://puppet.com/)
	- [WordPress](https://wordpress.org/)

## Sunday May 15, 2016

### Hardening WordPress, Again
- WordPress 4 major releases since March 2015 (St. Louis WordCamp 2015)
- [Panama Papers](https://panamapapers.icij.org/) - [Revolution Slider](https://revolution.themepunch.com/) vulnerability
- ImageMagick vulnerability
- Update your sites
- BruteProtect -> Jetpack Protect
- 98% vulnerabilities in WordPress security updates due to 3rd party code
- [Automattic Security White Paper](https://wordpress.org/about/security/)
- Include maintenance on fixed bids
- To help prevent attacks you tradeoff convenience for security
- Security is not just on WordPress
- DNS Proxies
- Network Firewall
- Server Firewall
- Web App Firewall
- Plugin firewall
- [OSI model](https://en.wikipedia.org/wiki/OSI_model)
- Machine BFD (CPHulk)
- Update permissions so only uploads are writeable unless you are upgrading WordPress

### Automating WordPress Plugin Development with Gulp
- [Slides](http://www.slideshare.net/mikehale1/automating-wordpress-plugin-development-with-gulp)
[WebDevStudios - Generator Plugin WP](https://github.com/WebDevStudios/generator-plugin-wp)
Plugin header placeholder tokens (Like handlebars `{value}`)

### Podcast Panel
- Building [Google PageSpeed](https://developers.google.com/speed/pagespeed/module/) module for NGINX sucks...
- It was a good panel but see previous note.

### Why WordPress Works this Way
- G.R.I.P.I. (Goals.Roles.Information.Process.Interpersonal)
- Unified project philosophy
- Philosophy driven development
- Democratize publishing
- WordPress should work out of the box
- As little configuration as possible
- Design for the majority of users
- Solid array of basic features
- Users shouldn't have to know/care what version of PHP they are on. (I agree but they should be aware that it needs to be upgraded from time to time. Just like a cars oil you wouldn't go 10 years without changing your oil...)
- Decisions not options
- Options are expensive
- [Havoc Pennington](https://en.wikipedia.org/wiki/Havoc_Pennington) - Author/Writer
- Options hard on QA and UI
- Striving for simplicity
- Accessibility
- Deadlines are not arbitrary
- Document flows
- Don't just study the code. Philosophy is important as well
- Philosophy drives development

## Casual AMA/Hangout/Networking/Closing Notes
- I still do not understand why [Genesis Framework](http://my.studiopress.com/themes/genesis/) is helpful. If the biggest value is to add hooks to templates you could have edited on your own just does not make any sense. I guess if you view it from an implementor instead of a developers mind set it would make more sense.
