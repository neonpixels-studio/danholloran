---
date: "2026-11-21T02:16:51.000-08:00"
tags: ["finance", "markets", "investing", "what-moves-markets"]
draft: false
title: "Priced In: How Fed Funds Futures Turn a Price Into Rate Hike Odds"
image: "/images/posts/priced-in-how-fed-funds-futures-turn-a-price-into-rate-hike-odds.jpg"
topic: "finance"
description: "That 93% chance of a Fed hike is arithmetic on one futures price, not a forecast. Here's the math behind it and what the number can't tell you."
---

Every few weeks a headline says something like "markets now see a 93% chance of a Fed hike in December." It reads like a poll, or like someone at the Fed leaked a plan. Neither is true. Nobody was surveyed. That number comes from running a bit of arithmetic on the price of one exchange-traded contract.

Once you know the arithmetic, the phrase "priced in" stops being vague. It also explains why stocks sometimes fall on a rate cut and rally on a hike: by the time the decision lands, the market has usually already traded on the expected move, so the price reacts only to the part nobody expected.

## The contract behind the headline

The source is the CME's 30-Day Federal Funds futures (ticker ZQ). Each contract covers one calendar month and settles at **100 minus the average daily effective federal funds rate (EFFR)** for that month. The EFFR is the volume-weighted rate banks actually charge each other for overnight loans, and the New York Fed publishes it every business day. It trades inside the target range the Fed sets.

So a December contract at 95.957 says the market expects December's EFFR to average 100 − 95.957 = **4.043%**. That's all the contract tells you directly. It's a bet on an average, not on a decision.

Turning that average into odds for a specific meeting takes a few assumptions. CME spells them out in its [FedWatch methodology](https://www.cmegroup.com/articles/2023/understanding-the-cme-group-fedwatch-tool-methodology.html): rate moves come in 25 basis-point steps (a basis point is 0.01%), and the EFFR moves one-for-one with the target.

## From price to probability, step by step

Here's a simplified version using numbers close to where things stood in mid-November 2026. The target range was 3.75–4.00%, the EFFR was around 3.88%, and the FOMC (the Fed committee that sets rates) decides on December 9.

December has 31 days. Assume the rate stays at 3.88% through the 9th (9 days), then sits at some new level for the remaining 22 days. The futures price pins down the monthly average, so you can solve for that new level:

```
Average Dec EFFR = 100 − 95.957          = 4.043%
4.043 × 31 = (3.88 × 9) + (X × 22)
X (EFFR after the meeting)              ≈ 4.110%
Expected change = 4.110 − 3.88          ≈ 0.23 percentage points
In 25 bp steps   = 0.23 / 0.25          ≈ 0.92
```

The FedWatch method splits 0.92 into a whole number (0 hikes) and a remainder (0.92), and reads it as a **92% chance of a 25 bp hike and an 8% chance of no change**. If the math gave 1.3 instead, that would mean a 70% chance of exactly one hike and a 30% chance of two.

The real tool is more careful than this sketch. Instead of assuming the starting rate, it anchors on months with no FOMC meeting, whose contracts give a clean reading of the rate with no decision in the middle. Then it works outward from those anchors and chains several meetings into a probability tree. But the core move is the same: get the average from the price, back out the rate after the meeting, and divide by 25 bp.

## What the number is not

**It's not a forecast from anyone.** CME doesn't predict the outcome and the Fed doesn't endorse it. The number says what futures prices imply _under the tool's assumptions_. If the assumptions are off, so is the percentage.

**It's not a pure probability.** Futures prices also reflect hedging demand and the extra return traders want for holding rate risk. A bank hedging a loan book is buying protection, not stating a belief. On a quiet day the effect is small. Around a surprise data release, it can tilt the reading by a few points.

**It can't express anything outside 25 bp steps.** If traders think a 50 bp move is possible, the tool shows it as split odds between neighboring outcomes. The EFFR can also drift inside the target range around month-end and quarter-end funding pressure, which shifts the implied rate even when nobody expects the Fed to act.

**It moves, a lot.** The December 2026 meeting has been priced for about a year. According to [Frenzy Capital's daily history](https://www.frenzycap.com/fedwatch/2026-12-09), in late February 2026 futures showed about a 45% chance of a _cut_ at this meeting. By November that had flipped to about a 93% chance of a _hike_. A "93%" in the headline is a snapshot of today's pricing, not a settled fact.

That's why "priced in" matters. If the hike is already at 93%, delivering it barely moves the market. The 7% no-change scenario is the real surprise. It also explains why the Fed's statement and the [dot plot](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) of projected rates often move prices more than the decision itself: they update the odds for every meeting after this one.

To see this for yourself, open CME's [FedWatch tool](https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html) before the next FOMC meeting and compare its odds with the ZQ contract prices. Then come back the morning after the decision. The gap between what was priced and what happened will explain the market's reaction much better than the headline did.
