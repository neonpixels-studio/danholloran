---
extends: _layouts.post
section: content
title:  Why Does ExpressionEngine Save Templates in the Database?
date: 2016-01-16
categories: []
published: true
---

This is a little bit of a rant and a large amount of it may be a result of my inexperience. This is in no way saying ExpressionEngine is bad and something like WordPress is better. I feel it is more a surprise from using CodeIgniter before and CodeIgniter is used to build ExpressionEngine. Maybe things have changed in the way CodeIgniter handles MVC. Also maybe this is just a situation of a large user base needing access to more tools in your views.

I have been maintaining a few ExpressionEngine sites lately and one thing that seemed curious to me is saving templates in the database. I am not saying this is the wrong way to do things but just seems strange. I would want to make as few database calls as possible.

One reason I see is possibly the templates are not supposed to have any real logic in them. So its much like post content in WordPress which I think is fine. It rides that line between maintainer flexibility and page load speed among other things. In most templating engines I have seen they function much like this. You get access to some programming helpers without any real logic going on.

This still makes it kind of curious that there is an option to save as a file as well. I am not sure which takes precedence but I would hope the file does. I would think you could just read in the file not sure if there is an issue with that? I would assume it already does this so why would you also save it to the database.

Maybe save the diffs still when you edit so you can roll back the changes that could be helpful. However what happens when you use version control since you really should be. This will solve that exact use case in a little better way. Would you ignore your template files that just seems a little weird.

I would agree that this may have some benefits not sure what they are though. One thing I do not agree with is the ability to execute queries from the templates. Sure in WordPress you can execute queries from a template but thats more because WordPress templating is frustratingly procedural but thats a story for another day.

However I just feel that executing multiple queries mixed in with view code is weird. I personally would not feel comfortable allowing a user access to database queries. Editing HTML is one thing may make the page look a little funny but it can be fixed. You mess something up such as a query you may white screen the page or open yourself up to some sort of security issue.

Maybe I am missing something or am just seeing bad development practices being used. There may actually be good reasons why ExpressionEngine saves views with database queries in the database.
