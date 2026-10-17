---
date: "2026-10-17T02:14:20.000-07:00"
tags: ["finance", "trading", "risk-management", "markets", "position-sizing"]
draft: false
title: "Position Sizing: The Risk Decision That Matters More Than Your Entry"
image: "/images/posts/position-sizing-the-risk-decision-that-matters-more-than-your-entry.jpg"
topic: "finance"
description: "How much you put into a trade quietly decides whether you survive a losing streak. Here is the math behind fixed fractional sizing, the 1% rule, and why practitioners cut the Kelly criterion in half."
---

Most conversations about trading are about _what_ to buy and _when_. Which stock, which setup, which entry. Far less attention goes to the question that actually decides whether an account survives a bad month: _how much_.

Position sizing is the part of a trade you fully control. You can't control whether the market moves your way, but you can control how much damage it does when it doesn't. Two people can take the exact same trades with the same entries and exits and end up in completely different places, purely because one sized each position at 1% risk and the other at 10%.

## The asymmetry that makes sizing matter

Losses and gains are not symmetric. If an account drops 10%, it needs an 11.1% gain to get back to even. That sounds manageable. But the gap widens fast:

| Drawdown | Gain needed to recover |
| -------- | ---------------------- |
| 10%      | 11.1%                  |
| 20%      | 25.0%                  |
| 30%      | 42.9%                  |
| 50%      | 100.0%                 |

Now combine that with something every strategy eventually hits: a losing streak. Here is what's left of an account after ten consecutive losing trades at different risk levels per trade:

- **1% per trade:** about 90.4% of the account remains
- **2% per trade:** about 81.7% remains
- **5% per trade:** about 59.9% remains
- **10% per trade:** about 34.9% remains

At 1%, ten straight losses is an annoying drawdown. At 10%, it's a hole that requires nearly tripling what's left just to break even. Ten losses in a row sounds rare, but for a strategy that wins 45% of the time, a streak like that shows up eventually if you trade long enough. Sizing determines whether that streak is a bad week or the end of the account.

## Fixed fractional sizing and the 1% rule

The most common framework for retail traders is **fixed fractional sizing** (also called percent-risk sizing). You decide the fraction of current account equity you're willing to lose on a single trade, then work backward from your stop-loss to figure out how many shares to buy.

The formula is simple:

```
position size = (account equity × risk fraction) ÷ (entry price − stop price)
```

A worked example: you have a $50,000 account and use a 1% risk fraction. That means the most you're willing to lose on this trade is $500. You want to buy a stock at $40 with a stop-loss at $38, so each share risks $2. Divide $500 by $2 and you get **250 shares**, a $10,000 position.

Notice what happened there. The position is 20% of the account, but the _risk_ is 1%. Those are different numbers, and confusing them is one of the most common sizing mistakes. A tighter stop lets you hold more shares for the same risk; a wider stop means fewer.

Because the fraction applies to _current_ equity, the dollar amount at risk shrinks automatically during a drawdown and grows after gains. That's a built-in brake: you naturally take smaller swings when things are going badly. The tradeoff is that recovery is slower, since you're rebuilding with smaller positions.

Why 1%? There's nothing magic about the number. Educational sources commonly cite 1 to 2% per trade as a standard range, with 0.5% for untested strategies or for recovering from a drawdown. The point is less the exact figure than having _a_ rule and applying it consistently.

Two caveats worth stating plainly. Sizing only works if the stop is real: a gap down overnight can blow straight through a stop order and fill well below it. And sizing doesn't turn a losing strategy into a winning one. It just controls how long you survive while you find out.

## Kelly, and why nobody uses the full Kelly

If fixed fractional sizing tells you how to apply a fraction, the **Kelly criterion** is the classic attempt to calculate what that fraction _should_ be. Developed by John Kelly at Bell Labs in 1956, it gives the bet size that maximizes long-run compounded growth when you know your edge.

For a simple bet with win probability `p` and a payoff ratio `b` (how much you win per dollar risked), the Kelly fraction is:

```
f* = p − (1 − p) ÷ b
```

Say you believe a strategy wins 55% of the time with an even payoff (`b = 1`). Kelly says risk 0.55 − 0.45 = **10%** of the account per trade.

Here's the catch: Kelly is only optimal if `p` and `b` are exactly right, and in markets they never are. They're estimates from past data, and edges decay. Suppose your real win rate is 52%, not 55%. The true Kelly fraction is then 4%, and you're betting 2.5 times that. Past twice the Kelly fraction, expected long-run growth drops to zero and then turns negative. Overestimate your edge a little and full Kelly will steadily shrink the account, even though each bet still looks favorable on paper.

That's why practitioners typically use **half Kelly** or less. Under standard assumptions, half Kelly keeps roughly 75% of the maximum growth rate while cutting volatility in half and making deep drawdowns much less likely. Giving up a quarter of theoretical growth to buy a large margin for estimation error is usually a good trade.

There's a related idea that applies to long-term investors too: **volatility drag**. Compound growth is roughly the average return minus half the variance. An asset averaging 25% a year with 50% volatility compounds at only about 12.5%, slower than one averaging 15% with 15% volatility. Oversizing a volatile position amplifies exactly that drag.

## The takeaway

Position sizing is the least glamorous part of trading and investing, and probably the most important. The questions to ask before any trade are: what's the most I'm willing to lose here, as a percentage of the account, and where is the stop that defines that loss? If you can't answer both, the entry doesn't matter much yet. For further reading, Ed Thorp's papers on the Kelly criterion in blackjack and markets are the best primary source on the math, and they're more readable than you might expect.
