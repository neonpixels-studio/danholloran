---
extends: _layouts.post
section: content
title:  Setting Up a Jekyll Blog - Part 2
date: 2015-07-17
categories: []
series:
  url: "/2015/07/29/setting-up-a-jekyll-blog-part-3/"
  label: "Setting Up a Jekyll Blog - Part 3"
published: true
---

### Adding Your First Post.
So we are already to write our first post. To create a new post all you have to do is make a new file in the _posts directory and title it `YEAR-MONTH-DAY-title.MARKUP`. If you prefer to start all your posts as drafts you just need to create a new file in the _drafts directory and title it `title.MARKUP`. Once you have completed the draft you can move it to the _posts folder and add the `YEAR-MONTH-DAY-` to the beginning of the file name.

So lets say the title of our first blog post is "My First Jekyll Blog Post" then the name of the post would be `2015-07-14-my-first-jekyll-blog-post.md` or if it is a draft then it would just be `my-first-jekyll-blog-post.md`.

Then you need to add the [Front Matter](http://jekyllrb.com/docs/frontmatter/) which is a way to tell Jekyll a little more about what this file is. At the top of your newly created file you can add this.
```
---
layout: post
title: My First Jekyll Blog Post
---
```


By default Jekyll supports [Markdown](http://daringfireball.net/projects/markdown/syntax) but you can add formatters for [many different formats](http://jekyllrb.com/docs/plugins/#converters-1). You can also access media assets in a folder such as assets using the &#123;&#123; site.url &#125;&#125; /assets/screenshot.jpg variable in the post.
`![My helpful screenshot](/assets/img/screenshot.jpg)`

### Building Your Blog.
There are a couple options depending on if you are planning on hosting through [Github Pages](https://pages.github.com/) or somewhere else. Either way there is a build command that just builds the required files for the blog. Then there is a server command that builds the site and then servers it up on http://127.0.0.1:4000/ while watching for changes. Both the build and server command have a --drafts flag that will also build/serve your drafts as your latest posts. Which makes it easy for writing your draft posts just make sure not to deploy the sites directory right after building with the --drafts flag.

```bash
# Default Jekyll build.
jekyll build;
# Jekyll serve on http://127.0.0.1:4000/.
jekyll serve;
# Jekyll build drafts.
jekyll build --drafts;
# Jekyll serve on http://127.0.0.1:4000/ drafts.
jekyll serve --drafts;

# Github Pages Jekyll build.
bundle exec jekyll build;
# Github Pages Jekyll serve on http://127.0.0.1:4000/.
bundle exec jekyll serve;
# Github Pages Jekyll build drafts.
bundle exec jekyll build --drafts;
# Github Pages Jekyll serve on http://127.0.0.1:4000/ drafts.
bundle exec jekyll serve --drafts;
```

The main difference between the default Jekyll and Github Pages is that with Github Pages you use Bundler as well. This way you have the same environment as Github Pages.

### Front matter
So I am still learning about front matter my self. However I just view it as meta you add to the post. I come from the WordPress world and it would be the equivalent of custom meta. Without the having to add form fields, save, sanitize, retrieve, and display the data. You can find more information about [Front Matter](http://jekyllrb.com/docs/frontmatter/) in the docs. The built in types of Front Matter are layout, permalink, published, category, categories and tags. You are free to add anything you want so you can use it in your templates. You can even set defaults in your `_config.yaml` so you do not have to repeat yourself. An example of what I include in mine right now is below and you can find more in the [documentation](http://jekyllrb.com/docs/configuration/#front-matter-defaults)
```yaml
defaults:
  -
    scope:
      path: "" # an empty string here means all files in the project
    values:
      layout: "default"
      author: "Dan Holloran"
```

So now we can get started sharing all of our knowledge with the world one post at a time. Up next I will be diving more into editing the different templates in Jeykll. Jeykll uses a templating language called [Liquid](http://liquidmarkup.org/) developed at [Shopify](http://www.shopify.com/). If you have used any other templating language such as [Mustache](https://mustache.github.io/), [Handlebars](http://handlebarsjs.com/), [Twig](http://twig.sensiolabs.org/), etc. it should be fairly easy to pickup.
