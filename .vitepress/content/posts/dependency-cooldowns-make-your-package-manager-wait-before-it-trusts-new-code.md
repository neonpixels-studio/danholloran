---
date: "2026-10-12T02:15:05.000-07:00"
tags: ["tooling", "node", "javascript"]
draft: false
title: "Dependency Cooldowns: Make Your Package Manager Wait Before It Trusts New Code"
image: "/images/posts/dependency-cooldowns-make-your-package-manager-wait-before-it-trusts-new-code.jpg"
topic: "development"
description: "npm, pnpm, Yarn, and Bun can all refuse package versions that are only hours old. Here's how each one's release-age gate works, why the units don't match, and where it bites in CI."
---

Most npm supply-chain attacks follow the same script. Someone phishes a maintainer or steals a publish token, pushes a poisoned patch release, and then waits for every `^1.2.3` range on the planet to pick it up on the next install. The malicious version usually gets spotted and pulled within hours. The damage is done in those hours, by machines that installed it before anyone noticed.

A dependency cooldown attacks that window directly. Instead of installing whatever was published thirty seconds ago, your package manager only accepts versions that have existed for a while. It's a boring idea, and that's why it works: you let the rest of the ecosystem be the canary. Every major package manager now supports it, but each one picked its own config key and, annoyingly, its own unit of time.

## One idea, four spellings

Here's the same "wait at least a day" policy in each tool.

pnpm uses minutes, configured in `pnpm-workspace.yaml`. Since pnpm 11 this is **on by default** at 1440 minutes, so if you're on a current pnpm you already have it:

```yaml
# pnpm-workspace.yaml
minimumReleaseAge: 1440 # minutes
minimumReleaseAgeExclude:
  - "@myorg/*"
```

npm added `min-release-age` in CLI 11.10, measured in **days** and **off by default**:

```ini
# .npmrc
min-release-age=1
```

Bun uses **seconds**, under the `[install]` table:

```toml
# bunfig.toml
[install]
minimumReleaseAge = 86400 # seconds
minimumReleaseAgeExcludes = ["@types/node", "typescript"]
```

Yarn Berry (4.10+) calls it `npmMinimalAgeGate`, in minutes:

```yaml
# .yarnrc.yml
npmMinimalAgeGate: 1440
```

Minutes, days, seconds, minutes. If you maintain a repo that switches package managers, or you copy a snippet from a blog post written for a different tool, it's very easy to set a 1440-_day_ cooldown in npm or a 24-_second_ one in Bun. Leave a comment with the unit next to the number every time.

## The details that actually matter

The headline setting is simple. The edge cases are where teams get surprised.

**It applies to transitive dependencies too.** That's the point: the attack rarely lands in a package you depend on directly. pnpm's docs are explicit that the gate covers the whole tree, which also means a deep dependency like `caniuse-lite` (which publishes constantly) can be the thing that trips it.

**Strict vs. fallback.** In pnpm, if nothing in your requested range is old enough, there are two possible behaviors: fail, or fall back to the too-new version. pnpm's built-in default of 1440 is non-strict for backward compatibility, so it quietly falls back. The moment you set `minimumReleaseAge` yourself, `minimumReleaseAgeStrict` flips to `true` and the install fails instead. That's the behavior you want for security, but be ready for it.

**Lockfiles behave differently per tool.** Bun only applies the gate during new resolution, so entries already in `bun.lock` are left alone. pnpm goes further: by default it re-checks every lockfile entry against the policy on install, which catches a lockfile someone generated under a weaker setting. You can turn that off with `trustLockfile: true`, but only do it if every commit comes from people you trust.

**Missing timestamps pass by default.** The gate relies on the registry's `time` metadata. Some private registries and mirrors don't serve it, and both pnpm and Bun treat an undated version as passing. If you run an internal proxy, pnpm lets you tighten this:

```yaml
minimumReleaseAgeIgnoreMissingTime: false
```

**npm's config output can lie to you.** There's an open npm CLI issue where `npm config ls --long` reports `min-release-age = null` even though `npm install` is honoring the setting, because npm converts it to a `--before` date internally. Test the behavior with an install, not by reading the config dump.

## Where it bites, and how to live with it

The most common complaint after pnpm 11 shipped wasn't about attacks. It was Dependabot. A bot opens a PR the moment a new version appears, CI runs a frozen install, and the brand-new version is younger than the cooldown, so CI goes red. The PR isn't wrong, it's just early. Your options are to delay the bot (Dependabot and Renovate both support a minimum age or cooldown on their side), or add a narrow, version-pinned exclusion:

```yaml
minimumReleaseAgeExclude:
  - nx@21.6.5
  - webpack@4.47.0 || 5.102.1
```

Pinning to a specific version beats excluding a whole package name. A name-level exclusion means every future release of that package skips the gate, which is exactly the hole an attacker wants. pnpm can even clean up stale exclusions for you with `minimumReleaseAgeExcludePrune: true`.

The other real cost is urgent security patches. When a CVE fix lands and you need it now, the cooldown is in your way. npm lets you override per command:

```bash
npm i --min-release-age 0 some-package@1.4.2
```

Use that deliberately, for the one package, and don't bake it into scripts.

Finally, be honest about what this protects you from. A cooldown only helps against compromises that get caught quickly. A patient attacker who ships something that sits undetected for weeks walks right through it. It's one layer, alongside lockfiles, `allowBuilds` / install-script controls, and provenance checks like pnpm's `trustPolicy: no-downgrade`.

If you're on pnpm 11 or newer, you've already got a soft version of this. Set `minimumReleaseAge` explicitly so it becomes strict, add a cooldown to your update bot so it stops racing your own policy, and if you're on npm, add `min-release-age=1` to your `.npmrc` today. It's one line, and it turns "we installed the bad version" into "we read about the bad version."
