---
date: "2026-07-15T02:07:53.000-05:00"
tags: ["finance", "investing", "taxes", "stocks", "tax-loss-harvesting"]
draft: false
title: "Tax-Loss Harvesting: How Selling at a Loss Actually Works"
image: "/images/posts/tax-loss-harvesting-how-selling-at-a-loss-actually-works.jpg"
topic: "finance"
description: "Tax-loss harvesting turns a losing position into a deduction, but the mechanics are fussier than the pitch suggests. Here's how the netting order, the wash sale rule, and the cost-basis catch actually work."
---

Every December, some corner of financial media rediscovers tax-loss harvesting and describes it as free money: sell your losers, write off the loss, buy back in, collect a smaller tax bill. The framing is off in two directions at once. It undersells the mechanics, which are genuinely useful and worth understanding, and it oversells the outcome, which is mostly a deferral rather than a discount.

The idea underneath is simple enough. In a taxable brokerage account, you owe tax on gains you realize, not on gains you hold. The flip side is that losses you realize can cancel gains you realize. Harvesting just means deliberately triggering the loss side of that equation while you still hold a broadly similar position in the market. The complications are all in the details of _how_ the offset gets applied and _what_ counts as broadly similar.

## The netting order is not optional

Losses do not go wherever you want them. The IRS applies them in a fixed sequence: short-term losses offset short-term gains first, long-term losses offset long-term gains, then whatever is left crosses over to offset the other type. Only after all of that does anything hit your ordinary income, and there the cap is **$3,000 per year** ($1,500 if married filing separately).

A worked example makes the ordering concrete. Say you realized $12,000 of short-term gains this year and you're sitting on a position down $20,000. Harvest it and the $20,000 short-term loss first erases the $12,000 short-term gain. The remaining $8,000 flows onward: $3,000 reduces your ordinary income, and the last $5,000 becomes a carryforward.

That carryforward does not expire. It sits on your books indefinitely, available to offset gains in 2027, 2028, or whenever, or to keep taking the $3,000 ordinary-income deduction each year until it's used up. This is the part people underrate. A large harvested loss is a multi-year asset, not a one-time coupon.

Two constraints worth naming. This only works in a taxable account, since losses inside an IRA, 401(k), or Roth generate nothing deductible. And the trade has to settle by December 31 to count for that tax year, which under T+1 settlement means executing by roughly the second-to-last business day of December, not the 31st at 3:59 p.m.

## The wash sale rule is the whole ballgame

Here's the rule that eats most naive attempts. If you sell a security at a loss and acquire a **substantially identical** security within 30 days _before or after_ the sale, the loss is disallowed. That's a 61-day window centered on the sale, and it applies across all your accounts and your spouse's accounts. Different brokers do not create separate universes.

A disallowed loss isn't destroyed, at least. It gets added to the cost basis of the replacement shares, so the benefit resurfaces later when you eventually sell those. But "later" may be much later, and you've lost the thing you were trying to buy: the deduction _this_ year.

The standard workaround is to sell one fund and buy a different one with similar market exposure but a different index. Sell an S&P 500 fund, buy a total-market fund. Note what does _not_ work: swapping the same index between issuers. A Vanguard S&P 500 fund and a Schwab S&P 500 fund track the identical index, and that's exactly the case the rule contemplates.

The uncomfortable middle ground is that "substantially identical" has never been crisply defined for funds. Two ETFs can track nominally different indexes and still hold nearly the same basket. [Kitces has written at length on this ambiguity](https://www.kitces.com/blog/the-wash-sale-problem-when-tax-loss-harvesting-almost-substantially-identical-mutual-funds-and-etfs/), and the honest summary is that the closer your replacement tracks the original, the more you're relying on the IRS not looking hard.

## It's a deferral, and the deferral has costs

The part the December articles skip: when you sell at a loss and reinvest the proceeds, your new cost basis is lower. You've claimed a deduction now and enlarged your future taxable gain by the same amount. If your tax rate is the same in both years, you have moved money through time, not conjured it. That's still worth real money, since a dollar deferred is a dollar you can compound, and it's worth more if you're harvesting short-term losses (taxed at ordinary rates) and paying back long-term gains later. But it is a timing advantage, not a rebate.

Against that sit real frictions: bid-ask spreads, market impact, and the tracking error you absorb while holding a replacement fund that doesn't move quite like the original. A loss isn't automatically worth harvesting. It's worth harvesting when the deferral benefit clears those costs, which is a smaller set of situations than "the position is red."

If you want to go deeper, [Vanguard's overview](https://investor.vanguard.com/investor-resources-education/taxes/offset-gains-loss-harvesting) is a clean primer on the mechanics, and [Schwab's wash sale explainer](https://www.schwab.com/learn/story/primer-on-wash-sales) covers the edge cases in more detail than most. The rules interact with your specific bracket, holding periods, and account structure, so this is one of the areas where reading the primary sources first makes a conversation with an actual tax professional much more productive.
