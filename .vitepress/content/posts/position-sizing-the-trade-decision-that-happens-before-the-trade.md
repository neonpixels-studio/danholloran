---
date: "2026-08-15T02:07:25.000-05:00"
tags: ["finance", "investing", "trading", "risk-management", "position-sizing"]
draft: false
title: "Position Sizing: The Trade Decision That Happens Before the Trade"
image: "/images/posts/position-sizing-the-trade-decision-that-happens-before-the-trade.jpg"
topic: "finance"
description: "Most trading education obsesses over entries and indicators. The arithmetic says how much you put on matters more than where you got in, and the math is less forgiving than it looks."
---

Give two people the exact same set of trades — same entries, same exits, same win rate — and one can finish the year up while the other is down 40%. Nothing about their analysis differed. The only variable was how much they put on each time.

That's an uncomfortable result if you've spent your time reading about indicators and chart patterns, because it means the part everyone argues about is downstream of the part almost nobody writes about. Position sizing is where the compounding actually happens.

## The arithmetic of getting back to even

Start with the least negotiable fact in the whole subject: losses and gains are not symmetric. The gain required to recover a drawdown is `1 / (1 - drawdown) - 1`.

| Drawdown | Gain needed to break even |
| -------- | ------------------------- |
| 10%      | 11.1%                     |
| 20%      | 25%                       |
| 25%      | 33.3%                     |
| 50%      | 100%                      |
| 75%      | 300%                      |

This isn't a model or a backtest. It's arithmetic, and it holds regardless of what you trade. The reason is boring: after a loss, every future percentage gain is calculated against a smaller base. Lose half your capital and you need to double what's left just to get back where you started.

The practical consequence is that the cost of a drawdown grows faster than the drawdown itself. Avoiding the deep hole is worth far more than any clever plan for climbing out of one, which pushes the whole question upstream into sizing.

## Fixed-fractional sizing, worked out

The most common approach is fixed-fractional: risk a set percentage of the account on each position, and let that number decide the size.

```js
// risk a fixed fraction of the account, let the stop distance set the size
function positionSize({ account, riskPct, entry, stop }) {
  const riskDollars = account * riskPct;
  const perShareRisk = Math.abs(entry - stop);
  return {
    riskDollars,
    shares: Math.floor(riskDollars / perShareRisk),
    notional: Math.floor(riskDollars / perShareRisk) * entry,
  };
}

positionSize({ account: 25000, riskPct: 0.01, entry: 48.0, stop: 45.5 });
// { riskDollars: 250, shares: 100, notional: 4800 }
```

A $25,000 account risking 1% has $250 on the line. With a stop $2.50 below the entry, that's 100 shares — a $4,800 position, or 19% of the account in market exposure, but only 1% at risk if the stop holds.

Now move the stop to $46.80. The per-share risk drops to $1.20, so the same $250 of risk buys 208 shares and a $9,984 position. Twice the exposure, identical risk. That's the thing worth internalizing: stop distance and share count are not two decisions, they're one. Tighten the stop without recalculating, and you've quietly doubled your exposure while telling yourself nothing changed.

The percentage you pick matters enormously over a losing streak, and every strategy has them. Ten consecutive losses at 1% leaves you down about 9.6%, which is annoying. The same ten losses at 10% per trade leaves you down 65%, which needs a 186% gain to undo. Same trades, same order, different outcome entirely.

One caveat the formula hides: a stop is an instruction, not a guarantee. Gaps, halts, and thin overnight books can fill you well past your intended exit, so the "1% risk" is a planning figure rather than a hard floor.

## What Kelly adds, and why nobody uses it straight

The Kelly criterion is the formal answer to "what fraction maximizes long-run growth?" For a simple bet it's `f* = (bp - q) / b`, where `p` is win probability, `q` is `1 - p`, and `b` is the payoff ratio. It maximizes expected logarithmic wealth — the geometric growth rate, not the arithmetic average.

The interesting part isn't the formula, it's the shape of the curve around it. Growth rises as you approach the Kelly fraction and falls off sharply past it. Bet meaningfully above optimal and your expected growth rate can go negative even though every individual trade still has positive expected value. You can be right about your edge and still lose money by sizing wrong.

That's why practitioners who use Kelly at all typically use a half or quarter of it. The input `p` is an estimate drawn from a limited sample, and overestimating your win rate by a few points can push the "optimal" fraction well past the real one. The penalty curve is lopsided: underbetting costs you some growth, overbetting can cost the account.

## The correlation trap

One last thing the per-trade math doesn't capture. Five positions at 1% each look like 5% of risk spread across five bets. If all five are regional banks, it's one 5% bet wearing five hats. Correlation collapses your diversification exactly when you were counting on it, so portfolio-level exposure is worth tracking alongside the per-trade number.

None of this tells you which trades to take, and that's the point. The market decides whether you're right. You decide how much rides on it — and that's the variable with the better math behind it. If you want to go further, the geometric-versus-arithmetic-return distinction is the thread to pull; it explains most of why this arithmetic behaves the way it does.
