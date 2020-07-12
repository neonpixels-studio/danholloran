---
extends: _layouts.post
section: content
title:  St. Louis WordCamp 2015 Notes
date: 2015-03-15
categories: []
published: true
---

In all WordCamp 2015 was definetly interesting. I thought that the Cain and Obeland in the Morning! "show" was pretty funny.  I think my favorite talk of the day was Atomic Design Principles, I've read about it before and semi-practice it even though I could do something like that better.  I also like the podcasting panel as well it was rather informative and a nice change of pace usually I just attened the full on developer talks.

Below I have my simple notes and schedule for posteritiy and will try to updated with the Speakers slides and WordPress.tv links as they become available.

## Schedule & Notes
* <a href="http://stlouis.wordcamp.org/2015/" target="_blank" rel="noopener noreferrer">St. Louis WordCamp 2015</a>
* <a href="https://twitter.com/wordcampstl" target="_blank" rel="noopener noreferrer">@wordcampstl</a>
* <a href="https://twitter.com/hashtag/wcstl" target="_blank" rel="noopener noreferrer">#wcstl</a>
* Saturday March 14, 2015
### Registration
*[8:00am]*

### CAIN & OBENLAND IN THE MORNING!
*[9:00am | Michael Cain, Konstantin Obenland]*
Cain & Obenland in the morning! – a morning show-style WordCamp talk with three segments: two that will cover any number of WordPress topics – current WP happenings, theming, design, development, best practices, worst practices, future trends, you name it – and a special guest interview with a big name from the WordPress world.

#### Notes:
* Offical Twitter plugin
* Apply Filters Podcast?

### LESSONS FROM THE 314 TEAM (BEGINNER)
*[Developer 2 | Room 201 | 10:15am | Chris Carter]*
“Having toddlers as coworkers” and other life lessons from the 314 team.

#### Notes:
* 314 Media
* Code Poet Directory?

### CSS SPECIFICITY IS A RAT-HOLE (INTERMEDIATE)
*[Developer 1 | Room 250 | 11:00am | Drew Bell]*
Decouple from the cascade and free your styles.

#### Notes:
* Problem other people CSS
* Sites change
* Too specific CSS makes change hard
* Specificity Calculator (Site)

### MANAGING WORDPRESS PROJECTS (INTERMEDIATE)
*[Developer 2 | Room 201 | 11:45am | Lucas Lima]*
**MANAGING WORDPRESS PROJECTS – LET’S GET BETTER ON THIS!**

Developers and Designers love to use their creativity to build amazing things for their clients with WordPress , however it’s not always that they are able to delivery those on time. WordPress is a wonderful tool that allow us to have a powerful website up and running in a couple of hours, so why do we need to be worried on how we manage our projects? I’m pretty sure you have tons of reasons to be worried about it…

We all know how hard it is to keep the expectations of our clients in a proper level over the course of the project. How difficult it is to maintain the scope, and if it changes, how to identify the impact before the “go live” date? I would like to present some basic concepts of Project Management applied specific to WordPress projects, using the experience I got managing projects for my company.

**Intended Audience**: WordPress Freelancers and Startups

#### Notes:

### ATOMIC DESIGN PRINCIPLES IN WORDPRESS THEMES (INTERMEDIATE)
*[Developer 1 | Room 250 | 12:30pm | Joe McGill]*
<a href="https://speakerdeck.com/joemcgill/atomic-design-with-wordpress" target="_blank" rel="noopener noreferrer">Slides</a>
If you spend your days designing and developing WordPress themes, you probably find yourself building the same elements over and over. Preprocessors like Sass and Less can speed things up inside a given site, but still – every site needs menus, buttons, headers, footers, form elements … you get the idea.

Well. What if you could craft your HTML and CSS (and your preprocessor variables, mixins and so on) into isolated patterns that:

* live at a single URL, so you can share it with whoever needs access, no matter where they are in the world;
* you can use over and over again, in project after project?
* yet still rewrite and restyle as a system, such that every single implementation can look wildly different?

That’s the essence of atomic design.

If you’re like me, you’ll discover the pattern libraries you build with atomic design give you a common starting point for new projects and a consistent process for your design system. The libraries themselves are simple to maintain, simple to expand.

And once you’re up and running, you can also use the WordPress template functions to organize your theme files the same way you’ve organized your pattern library.

#### Notes:
* <a href="http://bradfrost.com/blog/post/atomic-web-design/" target="_blank" rel="noopener noreferrer">http://bradfrost.com/blog/post/atomic-web-design/</a>
* Self contained
* Discrete taks
* Components
* Parts
	* Atoms
	* Molecules
	* Organisms
	* Templates
	* Pages
* Break pages into components
* 4.1 `the_posts_pagination();` and `get_the_post_pagination();`
* Use `include( locate_template() );` to keep variable scope instead of `get_template_part();`
* <a href="styleguides.io" target="_blank" rel="noopener noreferrer">http://styleguides.io</a>
* <a href="http://patternlap.io" target="_blank" rel="noopener noreferrer">http://patternlap.io</a>
* <a href="http://pea.rs" target="_blank" rel="noopener noreferrer">Pears WP Theme</a>
* Styleguides
	* One big long page
	* Use same production CSS/JS
	* Break up resources by pattern(HTML/CSS/JS)
	* Bundle/minify patterns for production
	* Base all patterns on real needs

### Lunch
*[1:00pm]*

#### Notes
- Yum!

### Podcasting Panel
*[Developer 1 | Room 250 | 2:00pm | Panel Pippin Williamson, Jef Chandler, Chris Miller, and Nile Flores]*

#### Notes:
* 30 minutes to 1 hour length
* Apply Filters, WordPress Weekly, The Matt Report
* iTunes "WordPress"
* Break media files into another server
* Consistent episodes
* Use stats viewer for your host as analytics
* Get your gear right
* You don't have to be perfect

### UNDERSTANDING AND APPLYING SECURITY TO YOUR WORDPRESS INSTALLATION (INTERMEDIATE)
*[Developer 2 | Room 201 | 2:45pm | Gregory Ray]*
Be prepared! Whether you are responsible only for running a single site for yourself, or maintaining dozens for your clients, you should know how to take reasonable precautions to secure WordPress against common attacks. We will review the types of active threats that WordPress sites face, how and why a site gets targeted, and then look at a variety of techniques for improving security.

* Some areas we will cover:
* Access controls
* Htaccess recipes to block specific attack types
* Moving key WordPress files to spoil scripting
* Obfuscation methods
* File permissions
* Coordinating with a web host system administrator
* Responding to an apparent hack
*
The overall goal will be to make your site(s) less attractive to opportunistic exploits, and give you a better sense of how to respond before (and, if necessary, after) a security breach.

#### Notes:
* Dot Gray Inc.
* .htaccess for dictionary attacks
* Disable XML-RPC
* Disable wp-config.php
* Disallow File Edit wp-config
* Disable WP version display (complete_version_removal)
* Relocate wp outside of root
* Read lock everything outside of wp-uploads. Themes?
* Disallow wp-* robots.txt
* Multi-tenancy/McCreary Method?

### AN ELEGANT WORDPRESS WORKFLOW WITH GIT (ADVANCED)
*[Developer 1 | Room 250 | 3:30pm | Bobby Bryant]*
In this talk, I would be discussing version control. But more specifically, I would be outlining a version control workflow called git flow. I would also be outlining how we use git flow in conjunction with services like beanstalk and bitbucket to auto deploy commits to staging and production environments.

I think this would be a great talk for various attendees. Beginners could begin to understand the power of version control, and advanced users could see how using git flow can be a benefit when working on larger projects, with multiple developers. As WordPress continues to make inroads into the enterprise marketplace, it is becoming more important for WordPress developers to implement safe and organized development processes.

#### Notes:
* <a href="https://10up.github.io/Engineering-Best-Practices/" target="_blank" rel="noopener noreferrer">10up engineering best practices</a>
* Desktop server (Application)
* Git Flow

### TAKING BACKWARDS COMPATIBILITY SERIOUSLY (ADVANCED)
*[Developer 1 | Room 250 |  4:15pm | Pippin WIlliamson]*

#### Notes:
* Filter get_post_meta for old meta keys
* Mentality of how to do it
* Add deprecated funcitons file and through debug error

### CLOSING REMARKS
*[4:45pm]*
Phew, we made it to the end of the first day of WordCamp St. Louis! We’d like to highlight a few superstars and remind folks of what the heck is happening on Sunday.

Then, on to the after party with a few pointers on travel/parking and where to go once you reach the City Museum.

### AFTER PARTY AT CITY MUSEUM
*[7:00pm]*
