---
extends: _layouts.post
section: content
title:  Setting Up a Jekyll Blog - Part 1
date: 2015-07-14
categories: []
series:
  url: "/2015/07/17/setting-up-a-jekyll-blog-part-2/"
  label: "Setting Up a Jekyll Blog - Part 2"
published: true
---

I found Jeykll fairly easy to setup not quite 5 minute setup easy but not to bad. Honestly I spent most of the time reading the documentation which is simple and excelent. I did want to go through the steps of how to setup your own Jeykll blog. I am going to assume some level of comfortability with the command line and non-Windows OS.

### Initial Setup
We first have to setup a few dependencies such as Ruby and Jeykll.

I prefer to install Ruby via RVM but any other method is fine more options can be found [here](https://www.ruby-lang.org/en/documentation/installation/)
`\curl -sSL https://get.rvm.io | bash -s stable --ruby`

Once you have Ruby installed you can install Jeykll
`gem install jekyll`

Now we are ready to create a new Jeykll blog.
`jekyll new my-blog`


### (Optional) Github Pages setup
Since your already using Git and Github you might as well host your blog there. Hey its free and simple don't have to worry about hosting.
If you are planning on deploying to [Github Pages](https://pages.github.com/) you can install the [Github Pages Gem](https://github.com/github/pages-gem) via [Bundler](http://bundler.io/).
1. Install bundler
`gem install bundler;`
2. Create a new Gemfile in the `my-blog` directory.
3. Add `gem 'github-pages'` into the Gemfile.
4. Run `bundle install` in the `my-blog` directory.

### Setting up _config.yml
Here is some of the main configuration I did granted there are way more things you can do. I am currently just using the default theme I hope to update it soon. You can find a list of all the options [here](http://jekyllrb.com/docs/configuration/).
```yaml
# Site settings
title: Your Site Name
email: youremail@provider.com
description: > # this means to ignore newlines until "baseurl:"
  My awesome blog description!
baseurl: "" # the subpath of your site, e.g. /blog/
url: "http://myurl.com" # the base hostname & protocol for your site
twitter_username: username
github_username:  username

# Excludes files from the site output
exclude:
  - node_modules
  - Gemfile
  - Gemfile.lock
  - gulpfile.js
  - LICENSE
  - package.json
  - README.md

# Outputting
permalink: pretty # /:categories/:year/:month/:day/:title/
timezone: America/Chicago # https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
paginate: 5 # How many posts to display per page on the blog roll
highlighter: pygments # Requires python to be installed

# Build settings
markdown: kramdown
```

### Wrapping up
Ok we now have a Jeykll blog setup and ready to go!  That was not to hard was it? Next up we will add our first post and some [Front Matter](http://jekyllrb.com/docs/frontmatter/) which is where Jeykll becomes really powerful.
