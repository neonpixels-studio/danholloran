---
date: "2026-07-17T02:06:48.000-05:00"
tags:
  ["obsidian", "pkm", "mobile", "workflows", "note-taking", "obsidian-mobile"]
draft: false
title: "Obsidian on Mobile: Stop Fighting the Toolbar"
image: "/images/posts/obsidian-on-mobile-stop-fighting-the-toolbar.jpg"
topic: "obsidian"
description: "Most people give up on Obsidian mobile because the defaults don't match how they actually capture notes. The fix isn't plugins — it's ten minutes in the Mobile settings."
---

There's a familiar pattern with Obsidian on the phone. You set up a vault you love on the desktop, install the mobile app so you can capture things on the go, use it twice, and then quietly go back to the stock notes app. The usual diagnosis is that the mobile app is underpowered, and the usual prescription is a pile of community plugins.

I think that's mostly wrong. The mobile app isn't underpowered — it's under-configured. The default toolbar is a generic guess at what an average person editing an average note might want, and it's almost certainly not what _you_ want, because the thing you do on your phone is different from the thing you do at your desk. On the desktop you write and refactor. On the phone you capture. Those need different buttons, and Obsidian ships mobile-specific controls to fix exactly that.

## The toolbar is a command palette you already touched

When you're editing a note on mobile, that row of icons above the keyboard is the mobile toolbar. It's easy to read it as a fixed formatting bar, like the bold/italic strip in any other editor, but it isn't. It's a fully reorderable list of commands, and it scrolls — if you've got more actions than fit, you swipe left and right along the toolbar to reach the rest.

You configure it in two places. The fast way is to tap **Configure mobile toolbar** (the wrench) right from the toolbar itself. The thorough way is **Settings → Mobile → Manage toolbar options**, where you can add, remove, and reorder every available action.

The part people miss is at the very bottom of that screen: **Add global command**. By default the toolbar only offers you editing actions — "Add internal link", "Add tag", that sort of thing. But "Add global command" opens the whole command palette to you. Anything with a command can live on the toolbar:

```
Settings → Mobile → Manage toolbar options → (scroll to bottom) → Add global command
  → type "Templater: Insert template" → select → lands at end of toolbar
```

That's the whole trick. If a plugin exposes a command — Templater inserting your capture template, Tasks adding a checklist item, a workspace switcher, Daily Notes opening today — it can be one tap away while your thumbs are already on the keyboard. Reorder so your three most-used actions sit on the left where your thumb naturally lands, and let the long tail scroll off to the right.

## Quick Action: the gesture worth spending on

The toolbar only exists while you're editing. Quick Action is the one that matters before you're editing anything: pull down from the top of the app, like refreshing a social feed, and it fires a single command of your choosing.

Out of the box it opens the Command palette, which is a perfectly reasonable default and also a wasted gesture. The palette is two taps away anyway. What you want on a pull-down is the thing you open the app to do in the first place. For most people that's capture:

```
Settings → Options → Toolbar → Configure mobile Quick Action → Configure
  → type "Daily note: Open today's daily note" → select → close settings
```

Now the app launch-to-writing path is: open Obsidian, pull down, type. No navigation, no quick switcher, no hunting through folders. If your capture flow runs through a template instead, point it at your Templater command and get the same result with your frontmatter pre-filled.

## The navigation bar is not the toolbar

These two get conflated constantly, and the distinction is what makes the mobile app click. The navigation bar appears when you're _not_ editing: back and forward chevrons, a plus-in-a-circle in the middle that opens the Quick switcher to create or find a note, a numbered box showing your open tabs, and an **Open menu** button at the end.

That last one is worth knowing about, because mobile has no ribbon. All the ribbon actions you're used to from the desktop's left edge live behind that menu button instead. If you've ever gone looking for a ribbon icon on your phone and concluded the feature doesn't exist on mobile, that's where it went.

The two bars swap places. The **Toggle keyboard** toolbar option dismisses the keyboard and drops you back to the navigation bar, which is a genuinely useful thing to keep on the toolbar itself — it's the fastest way out of editing mode without reaching for the keyboard's own dismiss.

## Configure first, install second

Spend ten minutes in **Settings → Mobile** before you install anything. Put your capture command on Quick Action, put your four or five real actions on the toolbar in thumb order, and learn where the ribbon went. A surprising amount of what gets sold as a mobile plugin problem is a defaults problem, and the community-plugin instinct — install five things, keep two, forget why the other three are enabled — costs you startup time on exactly the device where startup time is the whole experience.

If you want to go deeper, the [mobile app documentation](https://help.obsidian.md/mobile) covers sidebars, tab management, and the OS-specific bits. But the toolbar and Quick Action are where the return is. Get those right and the phone stops being a worse desktop and starts being the thing that feeds it.
