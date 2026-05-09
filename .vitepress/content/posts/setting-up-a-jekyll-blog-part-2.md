---
created_at: '2022-09-04T15:42:00.000-05:00'
tags: []
image: "/images/posts/setting-up-a-jekyll-blog-part-2.jpg"
title: Setting Up a Jekyll Blog - Part 2

---
### Adding Your First Post.

So we are already to write our first post. To create a new post all you have to do is make a new file in the \_posts directory and title it `YEAR-MONTH-DAY-title.MARKUP`. If you prefer to start all your posts as drafts you just need to create a new file in the \_drafts directory and title it `title.MARKUP`. Once you have completed the draft you can move it to the \_posts folder and add the `YEAR-MONTH-DAY-` to the beginning of the file name.

So lets say the title of our first blog post is "My First Jekyll Blog Post" then the name of the post would be `2015-07-14-my-first-jekyll-blog-post.md` or if it is a draft then it would just be `my-first-jekyll-blog-post.md`.

Then you need to add the [Front Matter](http://jekyllrb.com/docs/frontmatter/) which is a way to tell Jekyll a little more about what this file is. At the top of your newly created file you can add this.

```