---
date: "2026-10-24T02:16:38.000-07:00"
tags: ["finance", "investing", "markets", "risk-management", "bonds"]
draft: false
title: "Bond Duration: The One Number That Tells You What a Rate Move Will Cost"
image: "/images/posts/bond-duration-the-one-number-that-tells-you-what-a-rate-move-will-cost.jpg"
topic: "finance"
description: "Why bond prices fall when yields rise, how duration turns that into a percentage you can calculate, and what 2022 showed about it."
---

The 10-year Treasury closed at 5.00% on October 23, after touching 5.36% earlier in the month, its highest level since 2002. What gets skipped is the part that surprised a lot of people in 2022: bonds, the "safe" side of a portfolio, can lose real money when yields climb, and how much they lose is not a mystery. It is mostly captured by a single number printed on every bond fund's fact sheet.

That number is duration. If you have ever held a bond fund and wondered why it dropped while "nothing happened," duration is the explanation.

## Why prices and yields move in opposite directions

A plain bond is a fixed stream of cash: coupon payments on a schedule, then the face value back at maturity. Those amounts never change after issuance. What changes is the rate the market demands for lending money today.

Say you own a 10-year Treasury paying a 5% coupon, bought at par ($100). Tomorrow, new 10-year Treasuries are issued at 6%. Nobody will pay you $100 for your 5% bond when $100 buys a 6% one. Your bond's price has to fall until a buyer earns roughly 6% on it, counting both the coupons and the gain from buying below face value. The cash flows stayed put; the discount rate applied to them went up, so their present value went down.

That is the whole mechanism. Bond prices fall when yields rise because yesterday's fixed payments get repriced against today's higher alternative.

## Duration turns that into a percentage

Duration started as a measure of time (the weighted average of when you receive a bond's cash flows), but the version investors actually use is **modified duration**: the approximate percent change in price for a 1 percentage point change in yield.

Here is a worked comparison using Treasury-style bonds with semiannual coupons, each priced at par, then repriced after yields move 1 point in either direction:

| Bond    | Coupon / yield | Modified duration | Yield +1% | Yield -1% |
| ------- | -------------- | ----------------- | --------- | --------- |
| 2-year  | 4.69%          | 1.9               | -1.9%     | +1.9%     |
| 10-year | 5.00%          | 7.8               | -7.4%     | +8.2%     |
| 30-year | 5.00%          | 15.5              | -13.8%    | +17.4%    |

A few things jump out:

- **Longer maturity means more sensitivity.** The 30-year moves roughly eight times as much as the 2-year for the same yield shift.
- **Duration is a straight-line estimate of a curved relationship.** It predicts -7.8% for the 10-year; the actual drop is -7.4%. That gap is convexity: as yields rise, the price falls a bit less than the line says, and as yields fall it rises a bit more. For small moves the line is close enough; for big moves on long bonds, the curve matters.
- **Lower coupons mean higher duration.** A bond paying little interest along the way returns most of its value at the end, so more of its worth is exposed to discounting. A zero-coupon bond's duration is essentially its full maturity.

A handy back-of-envelope check: divide the yield by the duration. On the 10-year above, 5.00 / 7.8 is about 0.64. If yields rise by more than about 0.64 points over a year, the price loss outweighs the year's coupon income, and the total return goes negative. On the 2-year, yields would need to rise about 2.5 points to do the same.

## What 2022 looked like in practice

This is not hypothetical. The Bloomberg US Aggregate index, the standard benchmark for investment-grade US bonds, lost about 13% in 2022, its worst calendar year since the index began in 1976. The previous record loss was 2.9% in 1994. The 10-year yield went from about 1.5% at the end of 2021 to a peak near 4.3% in October 2022.

Duration explains why that year was so much worse than earlier rate scares. The Aggregate index's duration had spent much of 1992 to 2010 in the four-to-five-year range, then climbed to roughly 6.8 years by December 2021, because years of low rates pushed issuers toward longer, lower-coupon debt. A roughly 2.8-point yield rise against a 6-to-7-year duration lands in the neighborhood of the actual loss, minus the cushion from coupon income. Over the same rate surge, long-duration Treasury ETFs fell roughly 30% peak to trough, while short-term Treasury funds lost less than 5%.

The flip side is also duration at work. When yields fall, the same math runs in reverse, and long bonds rally hardest. Duration is not "risk" in a purely negative sense; it is exposure to rate changes in either direction.

## Reading it on a fund page

Every bond fund and ETF publishes an effective duration (the "effective" version also accounts for bonds that can be called early or have prepayment features, like mortgage-backed securities). It is usually right next to the yield. Reading the two together tells you most of what you need: the yield is what you collect if rates sit still, and the duration is roughly how many percent you gain or lose per point that rates move.

Two caveats worth keeping in mind. Duration only measures interest-rate sensitivity, not credit risk; a corporate bond can fall because the company weakens even if Treasury yields are flat. And it assumes the whole yield curve shifts together, which it rarely does: short and long rates often move by different amounts, which is why the 2-year and 10-year can tell very different stories in the same week.

Next time yields make headlines, look up the duration on whatever bond fund you hold or are curious about, and multiply it by the move. That one calculation turns "rates went up" into a dollar figure.
