---
date: "2026-11-27T12:52:56.000-08:00"
tags: ["ai", "ai-tooling", "security", "claude-skills"]
draft: false
title: "My Public Claude Skills Repo Is Generated, Not Mirrored"
image: "/images/posts/my-public-claude-skills-repo-is-generated-not-mirrored.jpg"
topic: "ai"
description: "I open sourced 12 of my 48 Claude skills by generating the public repo from a private one. The leak check failed 100 times on its first run."
---

I have 48 Claude skills. They cross-post my blog, audit my sites, transcribe videos, and check each other for drift. I'd learned enough building them that I wanted to share the architecture, so I decided to open source the library.

Then I read the skills as a stranger would. Every one of them was written for exactly one person: my vault path, my repo names, my domains, and my name, all over the place. Some skills were tied to accounts I'd never want public. A skill library isn't like a code library. It's closer to a diary that happens to execute.

So the public repo, [grimicorn/skills](https://github.com/grimicorn/skills), isn't a mirror of what I run. It's generated from it.

## Two repos and an export step

The full library lives in a private repo. A GitHub Action builds the public one on every push to `main`, and the whole policy sits in one config file:

```js
// Trimmed from the real config
export default {
  // Only these get published. New skills are private by default.
  include: [
    "skill-guard",
    "skill-scanner",
    "shared-env",
    "shared-error-log" /* ... */,
  ],

  // Personal values become placeholders, longest match first.
  substitutions: {
    "danholloran.me": "example.com",
    "/Users/dholloran": "/Users/you",
  },

  // Anything still matching after substitution fails the build.
  deny: [
    /\bholloran\b/,
    /dholloran/,
    /[\w.+-]+@(?!example\.)[\w-]+(\.[\w-]+)*\.[a-z]{2,}/,
  ],

  // Unpublished skills it's fine to name. Any other private name fails.
  mentionOk: ["blog-post-creator", "seo-audit" /* ... */],
};
```

The export script copies the allowlisted skills, swaps in the placeholders, lays a few hand-written files on top (a generic version of my constants skill, the README, the license), and then checks the result. It fails on any leftover personal term, any binary or symlink it didn't expect, and anything shaped like a token. `gitleaks` runs after that. If everything passes, the Action opens one pull request on the public repo with a single squashed commit, and nothing goes public until I merge it.

Two choices matter most here. The allowlist means a skill I write next month stays private unless I opt it in. And the leak check runs on the final output, not the source, so it catches whatever the substitutions miss.

## The first run failed 100 times

I expected a few hits. The first check reported 100.

Most were my name in prose, things like "Dan reviews the queue." A regex substitution turned those into "the user." Next came references to private skills. My shared libraries name the skills that use them, which is useful documentation and also a list of everything I'd chosen not to publish. Most of those names are harmless, like `blog-post-creator` or `seo-audit`, so they went on the `mentionOk` list. Every other private name still fails the build, so a new skill is treated as sensitive until I say otherwise.

Some lines needed real rewriting, like an example that happened to name a private skill. Those became per-file patches, and every patch has to find its target text or the export fails. When I edit a skill later, a patch that no longer applies breaks the build instead of quietly doing nothing.

Then the best kind of finding: one the checks didn't make. My deny list had my name and my domains, but not my macOS username, which sits in the middle of my Obsidian vault path. The regex never fired because I hadn't thought to write it. I only caught it reading through the files by hand. A deny list only covers what you thought of, and that's why the review gate still matters after a passing check.

My own security scanner also flagged the export. It found its own detection rules and my prompt-injection guide, which quotes attack strings on purpose. Those nine findings are suppressed by fingerprint in a file the export uses, so editing any of those lines makes it fire again.

## Keeping it in sync

I first wanted the repo to be the source of truth, with every skill edited in git and packaged from there. That would have fought how I actually work. Every edit lands in my Claude account first, whether through a review card, an upload, or my skill-fixer. I haven't found a way to push skills into the account from git, so a repo-first setup would mean uploading by hand forever.

So the sync runs one way. A scheduled skill reads the copy of my skills that Claude syncs into each session, copies them over `skills/` in a fresh clone of the private repo, and commits to `main` only when something changed. It refuses to run if the cache looks broken, or if a run would delete more than two skills at once. That push triggers the export, and the export opens the public PR. Editing a skill is still the only thing I do by hand; by the next day the change is in the public repo's review queue.

One more lesson came on day one. The export replaces the public repo's contents to match its output, and I'd added a LICENSE straight to the public repo. The first sync PR deleted it. Anything the public repo needs now lives in the private repo's overlay folder, because the export owns everything on the public side.

## What's in it

Twelve skills: the tooling that keeps the library honest (a pre-package guard, a static scanner, an auditor, and a fixer that only applies approved findings), the shared libraries every other skill builds on, and one orchestrator as a worked example. They aren't plug-and-play. They assume an Obsidian vault and my conventions. But if you're past five or six skills and starting to feel the drift, the [repo](https://github.com/grimicorn/skills) shows the structure I wish I'd started with.
