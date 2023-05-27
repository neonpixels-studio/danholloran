---
extends: _layouts.post
section: content
title: Change URLs On Your WP Engine Install
date: 2015-08-04
categories: []
published: true
---
We recently switched to [WP Engine](http://wpengine.com) which is an excellent choice for WordPress hosting. Managed hosting I believe is the best way to host a WordPress site. However it does have some quirks compared to our old host.

One is the way you have to update your site URL not only do you need to do it in WordPress like usual but you need to set it in your account. You can do that through the Migration Checklist or under Domains in your install. What the Migration checklist does not tell you is you need to change your WordPress URL in the database and not in the settings. This is primarily because of how WP Engines caching works and settings do not clear out all the way even if you clear the cache. So you get stuck in a somewhat half complete state.

Also if you used the [WP Engine migration tool](https://wordpress.org/plugins/wp-site-migrate/) you need to check your `wp-config.php` for `define( 'WP_HOME', 'http://example.com' );` and `define( 'WP_SITEURL', 'http://example.com' );`. Granted you probably shouldn't be setting your home/site URLs this way so if they are this would be a good time to delete them. The WP Engine migration tool changes all references of the old URL into the new WP Engine URL in the database and in the code. So even though you can access your home page from your main URL everything is loaded from the WP Engine URL. That should be all you will need to change configuration wise to setup your site URL.

You may also want to run an update for all the URLs in your content especially if you used the automated migration tool. I usually use [Velvet Blues Update URLs](https://wordpress.org/plugins/velvet-blues-update-urls/) bit seems to do the trick without any issues. So there you have it not to difficult to change the URL once you know the all of the possible places it needs to be changed.
