---
extends: _layouts.post
section: content
title:  Setup Vhosts in MAMP
date: 2015-07-16
categories: []
published: true
---

Setting up Vhosts in MAMP is really easy. VHost is short for Virtual Host which is basically just a way to access multiple "sites" on a server. Instead of changing MAMP to point at the site you want and then accessing it through `http://localhost/` you can access it from a custom domain. So lets get started.

The first thing you will need to do is create a new file in `/Applications/MAMP/conf/apache/` and name it `vhosts.conf`. We will come back to this file in just a second so you can go ahead and keep it open. Next up you will want to include `vhosts.conf` in `/Applications/MAMP/conf/apache/http.conf`. I usually just add it at the end of the file.

```apache
NameVirtualHost *:80
Include /Applications/MAMP/conf/apache/vhosts.conf
```

**Note:** You will want to change the `*:80` to `*:8888` if you are using the MAMP defaults I prefer to set MAMP to the Apache defaults.

Next you need to add a new Vhost to the `vhosts.conf` you created earlier. Just like when we included the `vhosts.conf` you will need to change the `*:80` to `*:8888`. You will need to update `myawesomesite` to the name of your awesome site.

```apache
# My Awesome Site
<VirtualHost *:80>
ServerName myawesomesite.dev
DocumentRoot /Applications/MAMP/htdocs/myawesomesite.com/
<Directory /Applications/MAMP/htdocs/myawesomesite.com/>
Options Indexes FollowSymLinks MultiViews
AllowOverride All
Order allow,deny
allow from all
</Directory>
</VirtualHost>
```

I prefer to follow the convention of using the production sites URL for a base to my sites folder directory and the local URL. So if your live site is `myawesomesite.com` then your domain would be `myawesomesite.dev` using the TLD of `.dev` is definitely optional but it makes it easy to be consistent. I also set my site directory to `myawesomesite.com` so 6 months down the road it is easy to match the site up to the production site.

Also while we are at it you can add a localhost Vhost so you can add things like an `index.php` of all your sites and a `phpinfo.php` among other things.
```apache
# Localhost
<VirtualHost *:80>
ServerName localhost
DocumentRoot /Applications/MAMP/htdocs/
<Directory /Applications/MAMP/htdocs/>
Options Indexes FollowSymLinks MultiViews
AllowOverride All
Order allow,deny
allow from all
</Directory>
</VirtualHost>
```

Now we will need to edit your hosts file at `/private/etc/hosts` with an editor such as Vim, Nano, Sublime Text 3, Atom or any other text editor. Even though the `hosts` does not have an extension it is still a file. In there you can add the following.
```bash
# Vhosts
127.0.0.1 myawesomesite.dev
```
You will need to add this for every Vhost that you add. You won't have to worry about the localhost since that is already defined by default.

Now we just have to stop and start the MAMP server. As long as we have done everything correctly you while be able to access your Vhost at the domain you set in the Vhost. I would access My Awesome Site at http://myawesomesite.com. One caveat to the domain name is if you want to access it with both `www.` and no `www.` you need to setup a separate vhost for `www.myawesomesite.com`. If you know of a better way please let me know.

Awesome there we go you have added your first of hopefully many Vhosts. To add a new one you will just have to copy the `<VirtualHost>` block we added to the `vhosts.conf`. Then  update the directory and the domain to whatever your new awesome site is.
