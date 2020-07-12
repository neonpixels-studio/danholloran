---
extends: _layouts.post
section: content
title:  WPBA Thoughts and Road Map
date: 2015-07-18
wpbaInlineForm: true
categories: []
alert_message: This project is no longer maintained.
published: true
---

### Update (7/18/2015) Survey Responses
Thank you to all who participated in the survey about WP Better Attachments Re-write. It did help to reinforce a few things I already thought. Primarialy the cropping portion probably would be best spun of as an add on. That would make it a little more easier to use as well as maintain. I will also be looking into external atachments and extending the WordPress attachments to allow for attaching media to multiple posts. I was actually surprised that there were some yes responses to paying for consistent updates, I appreciate that. I do not have any immediate plans for adding any sort of fees but feel free to donate through my [Pledgie campaign](https://pledgie.com/campaigns/20476). In all it went over pretty well basically re-inforcing almost every idea I had, thanks again. You can view the [final results here](https://www.surveymonkey.com/results/SM-Y2SKS2DY/).

@include('_partials.wpba-inline-newsletter-signup')

### Thoughts and Road Map
So I have been attempting to rewrite WPBA so it would be less of a frustration to update on my part since WordCamp SF 2013, I believe if was July/August of 2013.  If you have been under a rock it is now 2015, I keep feeling stuck because of some of the decisions I made before having the experience to make the correct decision.

One of the main pain points is the settings architecture I  really want to do away with if for the most part and move more towards filters.  I honestly wouldn't mind maintaining a settings page with the filters so less advanced users wouldn't have to touch the code.  Which I understand is a big road block for a non-developer, really it's a big road block even for many developers, think fear of CLI its just code in the end.  However migrating to a different settings solution requires writing database migration logic which I just cannot seem to force myself to do yet.

I also kind of regret bundling the cropping functionality into the plugin I really think the cropping editor is a helpful thing but it could probably be better maintained as an add on or a separate plugin.  We currently use a VIP cropping plugin which does the same thing the only downfall is if wordpress.com is down you loose your images.   It would be a minimum nice to totally disable the Crop Editor, or any other feature for that point, by a simple filter like `add_filter( 'wpba_enable_crop_editor', '__return_false' );`.

I also need to have a better strategy on support I think I really got burnt out after the first 6 months or so of maintaining the plugin. I threw in quite a few features some of my own wanting and some requested so this makes it much harder not knowing what is used and what is not.  I was looking at the stats for the plugin recently and it says there are over 5,000 active installs granted that view seems to have disappeared from wordpress.org so not exactly sure what it is now.  It made me think I really need to get back into supporting this plugin but I believe it requires a full overhaul of all the pieces.

 I want WPBA to be as easy to use as something like WooCommerce which is an extremely complex plugin but allows you to tweak and customize almost everything.  Honestly adding a filter or action to tweak something is extremely easy. What is not easy is the maintenance and documentation that goes along with it.

I think the worst thing about this is I have not run into the use case I originally built the plugin for which was to add different sliders to different pages.  Really I have not built anything in the last year that required attachments. Maybe I just have made decisions differently usually I use a custom post type instead but sitting hear thinking maybe the attachments route may have been a better solution.  I do not know maybe I should start using WPBA again it would help to motivate the development.

Thank you for your support I still have received 5 star reviews recently so apparently even though development has pretty much ceased people are still benefiting from it. If you would like to see the planned features for WP Better Attachments 1.4.0, it might need to be 2.0, you can check out the list on [GitHub](https://github.com/DHolloran/wp-better-attachments/issues/54). If you haven't already I would appreciate it if you could fill out this short survey [https://www.surveymonkey.com/s/K9LSWYX](https://www.surveymonkey.com/s/K9LSWYX).

Thanks,
Dan
