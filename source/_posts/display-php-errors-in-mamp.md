---
extends: _layouts.post
section: content
title: Display PHP Errors in MAMP
date: 2015-07-15
categories: []
published: true
---
Granted you never make any mistakes I am sure. However just in case you do you can  easily enable error reporting on MAMP to help catch the obvious ones. All you have to do is edit the `php.ini` in the MAMP directory `/Applications/MAMP/conf/php{Version}/php.ini`. If you're not sure what PHP version you are using you can find it in the MAMP at Preferences>PHP.

Just open the `php.ini` file in your favorite text editor like Sublime Text or Atom then find the line that starts with `display_errors =`. By default display errors is set to off `display_errors = Off` all you have to do is change the Off to On `display_errors = On`.  Then all you have to do is stop and then start the MAMP server. The next time you have a fatal error you won't be greeted by the white screen of death.
