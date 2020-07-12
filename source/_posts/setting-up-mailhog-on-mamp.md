---
extends: _layouts.post
section: content
title:  Setting up Mailhog on MAMP
date: 2016-06-26
categories: []
published: true
---
[Mailhog](https://github.com/mailhog/MailHog) is a tool that allows all of your outgoing mail to be intercepted. This is great for your development environment since you may need to test things incrementally. You really do not want your clients or users receiving your test emails.

I know a lot of the cool kids are setting up Mailhog along with other develop items to [Vagrant](https://www.vagrantup.com/) which I use sometimes as well. However we still use [MAMP](https://www.mamp.info/) at work building mainly WordPress sites and I could not find a write up on how to get Mailhog setup on MAMP.

This setup could be adapted to almost any environment since Mailhog is written in [Go](https://golang.org/) and is available on multiple platforms. I may end up needing to figure out how to set it up on [Laravel Valet](https://laravel.com/docs/valet). I am trying it out on a small scale and may switch full time to it eventually.

## Getting Started
So lets get started setting up Mailhog on MAMP. You can install Mailhog through [Homebrew](http://brew.sh/).
```bash
$ brew install mailhog
```

To start Mailhog when OSX boots up you can use [Homebrew Services](https://github.com/Homebrew/homebrew-services).
```bash
$ brew services start mailhog
```

You should now be able to access Mailhog on [http://127.0.0.1:8025/](http://127.0.0.1:8025/)

Now you will need to edit the sendmail_path configure in your PHP.ini. Which you should be able to find at `/Applications/MAMP/bin/php/{PHP_VERSION}/conf/php.ini` where {PHP_VERSION} is what every PHP version MAMP is using.

You will need to set the sendmail_path to `sendmail_path = /usr/local/Cellar/mailhog/{VERSION}/bin/MailHog sendmail test@test`. {VERSION} can be found by `$ls /usr/local/Cellar/mailhog/` then the folder in there will be the {VERSION} value. As of this writing 0.2.0 was the latests version.

Restart MAMP to make sure our changes take effect and fire off a test email. Now if you visit [http://127.0.0.1:8025/](http://127.0.0.1:8025/) you should see your test email. That is all there is, pretty simple right.

For servers such as managed WordPress hosting like [WP Engine](https://wpengine.com/) where you can not install Mailhog take a look at [Mailtrap](https://mailtrap.io/). It does everything Mailhog can do and more. Once you sign up for a Mailtrap account they give you simple example code to add to your project for many different languages and frameworks.
