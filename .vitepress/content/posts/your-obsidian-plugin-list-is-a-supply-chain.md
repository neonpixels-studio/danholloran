---
date: "2026-07-31T02:07:59.000-05:00"
tags: ["obsidian", "plugins", "pkm", "community-plugins"]
draft: false
title: "Your Obsidian Plugin List Is a Supply Chain"
image: "/images/posts/your-obsidian-plugin-list-is-a-supply-chain.jpg"
topic: "obsidian"
description: "Obsidian's 2026 Community directory added automated scans and safety scorecards for every plugin version. Here's what that changes, and how to actually audit the plugins already sitting in your vault."
---

The first time you click **Turn on community plugins**, Obsidian shows you a warning and most of us dismiss it in half a second. Two years later there are thirty-something plugins in the vault, six of which you cannot remember installing, and every single one of them can read every file on your machine.

That is not alarmism, it is the documented design. Obsidian's own [plugin security page](https://obsidian.md/help/plugin-security) says it plainly: due to technical limitations, Obsidian cannot reliably restrict plugins to specific permissions or access levels. Plugins inherit Obsidian's access. They can read files on your computer, connect to the internet, and install additional programs. Your plugin list is a dependency tree with no lockfile and no review step, sitting on top of the notes you care most about.

## What actually changed in 2026

On May 12, Obsidian launched [Obsidian Community](https://community.obsidian.md), a new directory and developer dashboard, and quietly fixed the biggest gap in the old model. Previously, only a plugin's _initial_ submission got a manual review by a small team, and every version after that shipped unreviewed. With more than 4,000 plugins and themes in the ecosystem and 120 million total downloads, that queue had become the bottleneck. Coding agents making it trivial to spin up a new plugin did not help.

Now every version is automatically scanned for security vulnerabilities, code quality issues, and malware. The results show up as a **safety scorecard** on each project's directory page. Manual review did not go away, it got redirected to popular, featured, and community-flagged plugins where a human read is worth the most. Obsidian has said disclosures are coming next, so plugins will declare up front whether they touch the network, file system, or clipboard, along with verified-author labels.

Two caveats worth holding onto. Scorecards are new, and Obsidian explicitly warns they can produce false positives and false negatives. And every previously approved plugin was granted a temporary exception, so a plugin that fails the new checks can still be installed today. A green card is a signal, not a guarantee, and the absence of a red one means less than you would like.

## Restricted Mode is a debugging tool, not just a switch

Restricted Mode is on by default and everyone turns it off on day one, which is why most people never think about it again. It is more useful than that.

Turning it back on (Settings → Community plugins → Restricted mode → **Turn on**) leaves every installed plugin in the vault, it just stops Obsidian from running any of them. That makes it the fastest way to answer the question you actually have after a bad update: is Obsidian broken, or is one of my plugins broken?

The workflow, when something goes weird:

1. Turn on Restricted Mode. If the problem disappears, it is a plugin.
2. Turn it back off and disable everything.
3. Re-enable in halves until the culprit shows up.

That takes about five minutes and beats scrolling the forum hoping someone else hit it first.

## A twenty minute vault audit

Open **Settings → Community plugins** and read the list honestly. For each entry, ask whether you have used it in the last month. If not, disable it and leave it disabled for two weeks. If nothing breaks and you never miss it, uninstall it. Every plugin you remove is one fewer thing that can go wrong, and one fewer thing to keep current.

For the plugins that survive that cut, pull up the directory page for each one and check two things: the safety scorecard, and the last-updated date. The Community site lets you sort by updated date now, which makes abandoned projects much easier to spot than the in-app browser ever did.

You can also just look at the code. Plugins live as plain files in your vault:

```bash
cd /path/to/vault/.obsidian/plugins

for p in */; do
  hits=$(grep -oE 'https?://[a-zA-Z0-9.-]+' "$p/main.js" 2>/dev/null | sort -u | wc -l)
  printf '%3d unique hosts  %s\n' "$hits" "${p%/}"
done | sort -rn
```

Most `main.js` files are bundled and minified, so this is a smell test rather than an audit. But a note-formatting plugin with a dozen distinct hostnames in it is worth ten minutes of your attention.

Finally, write down why each plugin is there. A single note with a short block per plugin turns the next audit into a review instead of an archaeology dig:

```markdown
---
plugin: Dataview
installed: 2025-03-11
reviewed: 2026-07-31
why: project rollup queries in Projects/
replaceable_by: Bases
---
```

The `replaceable_by` field is the useful one. Obsidian keeps absorbing plugin functionality into core, and plugins you adopted in 2023 are increasingly things the app now does natively.

## Where to start

Pick the five oldest plugins in your list and look up each one on [community.obsidian.md](https://community.obsidian.md). If a plugin has not been updated in a year and the scorecard is unhappy, that is your first uninstall. If you suspect one is genuinely malicious, you can flag it straight from its directory page or report it to Obsidian support.

The new review system does real work on your behalf, and it is a meaningful improvement over the old one. It just does not replace knowing what you installed.
