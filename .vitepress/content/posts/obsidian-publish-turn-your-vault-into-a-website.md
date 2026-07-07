---
date: "2026-07-07T02:07:29.000-05:00"
tags: ["obsidian", "pkm", "knowledge-management", "obsidian-publish"]
draft: false
title: "Obsidian Publish: Turn Your Vault Into a Website Without a Static Site Generator"
image: "/images/posts/obsidian-publish-turn-your-vault-into-a-website.jpg"
topic: "obsidian"
description: "How Obsidian Publish turns selected notes into a live, searchable website with backlinks and graph view intact, and when it beats rolling your own digital garden."
---

There's a familiar trap for anyone who has kept a vault for a while. You've written hundreds of genuinely useful notes, and at some point you think, "I should put some of this online." Then you spend a weekend wiring up a static site generator, writing a script to resolve `[[wikilinks]]` into real URLs, hunting down a plugin that fakes the graph view, and fighting your build pipeline instead of writing. The notes never ship. Obsidian Publish exists to skip all of that: it takes the notes you choose and serves them as a website, with the internal links, backlinks, and graph already working.

It's a paid add-on, not part of the free app, and it's worth being clear-eyed about what you're paying for. But if your goal is a public wiki or digital garden that stays in sync with how you actually think, it removes almost every piece of friction between "note in my vault" and "page on the internet."

## What actually gets published

The core idea is selective publishing. Nothing leaves your vault until you say so. You open the Publish changes dialog, pick the notes you want live, and hit publish. Change a note later and it shows up in that same dialog as pending, so your site is only ever as public as you deliberately made it.

Because Obsidian renders the site itself, the features that make your vault feel like a vault come along for free. Internal `[[links]]` resolve to real pages. Backlinks appear at the bottom of each note. The interactive graph view renders on the web so visitors can explore connections instead of reading top to bottom. Full-text search works across everything you published. None of that requires a plugin or a build step, which is the whole pitch: the reading experience on the web mirrors the one in your app.

You also get first-class SEO. Publish generates optimized metadata and social sharing cards automatically, and you can override the description, slug, and image on a per-note basis right in the note's frontmatter, so individual pages can be tuned without touching a config file.

## Setting it up and making it yours

Getting started is genuinely three steps: enable Publish, choose a note to serve as your home page, and publish your first batch. To set the landing page, you write a note with whatever title you want to be the entry point and designate it as home in the site's General settings.

Customization is where it gets interesting for developers. Publish reads two special files from the **root** of your vault: `publish.css` and `publish.js`. Drop a `publish.css` in the vault root, publish it from the changes dialog, and it restyles the entire site using the same Obsidian CSS variables and class selectors you'd use for an app theme. A common starting point is to copy an existing Publish theme's CSS, rename it to `publish.css`, and tweak from there:

```css
/* publish.css — lives in your vault root */
.published-container {
  --font-text-size: 18px;
  --line-width: 42rem;
}

/* hide the graph on mobile, keep it on desktop */
@media (max-width: 900px) {
  .graph-view-container {
    display: none;
  }
}
```

One gotcha worth knowing before you plan around it: `publish.js` only runs on sites served from a custom domain. If you stay on the default `publish.obsidian.md/your-site` URL, your CSS applies but your custom JavaScript won't, so don't build core functionality on it unless you're pointing your own domain at the site.

Other options round out the "real website" feeling: point a custom domain at your site for branding, turn on password protection (with support for multiple passwords) to gate a private garden, and publish or edit straight from the Obsidian mobile app when you're away from your desk.

## When it's the right tool

Publish is priced at $10 per site per month, or $8 per month billed annually, with a 40% education and nonprofit discount. That framing matters: it's per site, so a sprawling personal wiki and a small project doc are separate line items.

The honest tradeoff is convenience versus control. If you want your published notes to track your vault with zero maintenance and you value the native graph and backlinks, Publish earns its price by giving you back the weekends you'd lose to a custom pipeline. If you're comfortable with a static site generator, want full control over the HTML, or need to publish for free, a tool like Quartz that turns a vault into a static site is the better fit. Publish isn't trying to be the most flexible option. It's trying to be the one where the notes actually ship, and for most people that's the version that matters.
