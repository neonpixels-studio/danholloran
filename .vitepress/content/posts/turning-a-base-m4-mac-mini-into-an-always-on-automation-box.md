---
date: "2026-06-20sT22:31:35.000-05:00"
tags: ["tooling", "automation", "self-hosting", "mac-mini"]
draft: false
title: "Turning a Base M4 Mac Mini Into an Always-On Automation Box"
image: "/images/posts/turning-a-base-m4-mac-mini-into-an-always-on-automation-box.jpg"
topic: "development"
description: "Why I bought the cheapest M4 Mac mini, configured it to never sleep, and wired it up so I can run and control all my scheduled automations from my phone."
---

For the last year, most of my personal automation has lived on my MacBook Air. Blog cross-posting, content ingest, SEO, accessibility audits and more, all of it running as scheduled Claude skills. It worked great until I traveled. Close the lid and everything stops. Hop onto hotel WiFi and a schedule that assumed a stable connection quietly fails. An automation you have to babysit is not really automation.

So I bought a Mac mini to be the box that never sleeps.

## Why the base M4 (and a recycled hard drive)

I deliberately bought the cheapest M4 mini Apple sells. This is an experiment, not a commitment, but it is not a blind bet either. I have been running this exact set of skills on a comparably specced M-series MacBook Air, including overnight code automation that works through multiple issues and pull requests while I sleep, and it never broke a sweat. If anything the mini should hold up better: that Air is passively cooled, while the mini has an actual fan, so it can sustain a long overnight run without the thermal throttling a fanless laptop eventually hits. The mini runs around ten scheduled skills today and that number only goes up, but none of them are heavy. The only thing that would push me toward a higher-spec mini or a Studio is running local AI models, and I want to learn what I actually need before paying for it.

Storage I solved for free. I had an old 2TB external drive sitting in a drawer, so the mini's modest internal SSD holds the system and the external handles anything bulky. For a headless box you rarely touch, a drive hanging off the back is a non-issue.

## Making it actually always-on

A Mac mini does not stay awake just because it has no battery. macOS still sleeps the display, and if it thinks no monitor is attached it can get weird about how things render. Two fixes.

First, kill sleep on AC power:

```bash
sudo pmset -c sleep 0 displaysleep 0
```

The `-c` flag scopes it to wall power, which is the only state a mini is ever in.

Second, the headless gotcha: with no monitor plugged in, some apps and remote-desktop tools render to a phantom low-resolution screen or refuse to behave. A cheap 4K display emulator (a dummy HDMI plug) makes macOS believe a real monitor is attached, and everything renders at a sane resolution.

The rest is unglamorous but matters. Enable automatic login so an unattended reboot comes back to a logged-in session instead of stalling at the lock screen. And, a real tradeoff, I left FileVault off. FileVault is excellent for a laptop that can be stolen. On a headless box that needs to boot unattended into a usable state with nobody around to type a password, it gets in the way more than it protects.

## Controlling it from my phone

The whole point is that this thing runs while I am somewhere else, so I needed solid remote access from an iPhone. The stack that won:

Tailscale is the foundation. It is a mesh VPN, not just a tunnel. It gives the mini a stable private `100.x.y.z` address and a MagicDNS hostname that follow it anywhere, so I am not chasing a changing home IP or poking holes in my router. Every device on my tailnet can reach it directly and encrypted.

On top of that, two tools. For a shell I use Blink Shell with mosh, not plain SSH. This matters more than I expected. Plain SSH runs over TCP, and the moment your phone switches from WiFi to cellular the connection dies. Mosh survives network changes, so I can kick off a command at home and still have the session alive on the road. Mosh has to be installed on the server too:

```bash
brew install mosh
```

For full desktop access I use Screens over Tailscale to hit the mini's built-in VNC. Same private address, just the GUI instead of a terminal.

## The one part that didn't migrate

This is roughly the tenth Mac I have set up, counting school and work machines, so the OS-level setup was fast. I scripted most of it into a `setup.sh` and scanned my existing Macs to pull over the configs that were already dialed in. That part went smoothly.

The exception was my Claude schedules. They do not sync across devices, and the timing for when each task fires is not stored in the markdown task files. It lives in a separate task store, so there is no clean export to grab. I ended up recreating the schedules on the mini by hand from the task descriptions. If you run scheduled agent work across machines, know that the schedule itself is the thing that will not come along for free.

## What's next

Right now it is an automation box, but that is the boring first job. The plan is to grow it into a proper home server: Home Assistant for the home, NAS duties off that external storage, and a sandbox for self-hosted tools like n8n plus a few local AI experiments. A base mini is a surprisingly capable little anchor for all of it.

If you have automations you are tired of babysitting, a cheap always-on machine you can reach from your pocket changes how much you trust them. Mine has been worth every dollar of the base model.
