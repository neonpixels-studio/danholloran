---
extends: _layouts.post
section: content
title:  Shortcode API You're Doing It Wrong
date: 2015-07-25
categories: []
published: true
---
Few things first I am only using You're Doing It Wrong because WordPress core uses that internally so please do not take offense to it. Second for full disclosure I'm not a big fan of shortcodes in the first place they are fairly temperamental for anything complicated. I think it may mainly have to do with Tiny MCE and whitespace. Last thing before we get going lets shortcode all the things! Yeah that will make it super useable...

So I've seen quite a few complaints about [issues/changes to shortcodes](https://make.wordpress.org/core/2015/07/23/changes-to-the-shortcode-api/) after the [4.2.3 security release](https://wordpress.org/news/2015/07/wordpress-4-2-3/). First of all it's a security release so it cannot be publicly announced or even privately announced to plugin developers. Yes, I know that's kind of bad news and it is kind of bad that a large amount of site had shortcodes that were doing it wrong. It is however good that now you have one less venerability since being in the top 20ish% percent of websites makes WordPress a large easy target. Something at the scale of WordPress will once in a while not be able to cover every edge case when pushing out a security release. So before everyone starts to go blaming auto updates and WordPress lets take a look at the use cases outlined in the changes to the Shortcode API. Please feel free to add more use cases that I have missed in the comments below.

In the use cases outlined in the post they seem kind of weird that this is even a big issue. Would you put a `<span>` in  a style attribute or any other attribute for that matter?
```html
<!-- This doesn't feel right... -->
<div style="background-image: url('<span></span>');">

<!-- So why would this ? -->
<div style="background-image: url('[shortcode]');">
```
Yes, I know the shortcode would output an images URL but still... maybe I am wrong and you should be allowed to do this? Hopefully not then why would you put a shortcode in an HTML attribute granted. I get it you want access to a URL not easily accessible in the editor. Wouldn't it be a better experience just to tack on the attributes to the wrapping element to the shortcode? Maybe not in certain cases I could be wrong but I think in the vast majority of cases using a shortcode in an HTML attribute would be an error.

For the second use case the double quotes nested in double quotes I mean seriously. This doesn't work in PHP, it doesn't work in Javascript and I doubt it would work anywhere else. Sure you can escape quotes with a `/"` or `/'` however it is much more legible to do `"They're awesome!"` than `'They\'re awesome!'`. Sure these are fairly short strings so yeah not to bad in the form of legibility however if you have a paragraph or a large amount of `'` or `"` it gets real murky real quick. I'm sure your at least somewhat familiar with one if not both PHP and Javascript if you build shortcodes. So it should magically work this way forever if you knowingly exploit an obvious bug don't get upset when it gets patched. if you need the ability to add more general text don't use a self closing shortcode let the random text go in the body of the shortcode.

Honestly I have code that uses nested shortcodes this is an edge case not covered any where I have seen maybe this will come to bite me one day. It is created by having one shortcode nested in another shortcode `[shortcode-1][shortcode-2][/shortcode-1]`. Then doing `apply_filters( 'the_content', $sc_2_content );` before returning the value of `[shortcode-2]`. This may solve some of the issues more elegantly than putting a large amount of weird content into shortcode attributes. Maybe one day I will have to fix this due to a security update but it more extends the default use case rather than adds a new layer of complexity to it. You have to remember that shortcodes are found by [Regular Expressions](http://www.regular-expressions.info/). If you have ever done any work with them you know how frustrating it can be to get them to work correctly. Especially if there is a large amount of unknown unknowns so the fact that shortcodes work at all in the first place is awesome.


I seriously wish there was some way to have avoided this issue I never want to see someone have to scramble to update their theme or plugin. This makes auto updates look bad since WordPress updates and your site breaks. You'll automatically blame WordPress not the incorrectly coded theme or plugin. Even me as a developer may at first blame the issue on the WordPress update granted I would put the effort into finding the real cause. I know it is tough since you where kind of blind sided but don't blame core it was a mistake on your part.

This is just my personal views I may be looking at it from the wrong angle. I definitely do not have any commercial plugins or themes so from the support side of things I do not have to worry too much. I do have a few plugins on wp.org and yeah dealing with support issues is no fun. I also have a large amount of sites that I have built and maintain and none of them had any issues. This happens when building software that large groups of people use the fact that WordPress does not release breaking changes nearly at all is in its own way awesome and horrible at the same time. However thats a story for a different time.

I would love to hear you opinions about use cases and experiences I have not covered.
