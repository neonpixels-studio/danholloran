---
date: "2026-09-19T02:07:50.000-07:00"
tags: ["finance", "fintech", "banking", "robo-advisors"]
draft: false
title: "The Robo-Advisor Fee Is the Smallest Number That Matters"
image: "/images/posts/the-robo-advisor-fee-is-the-smallest-number-that-matters.jpg"
topic: "finance"
description: "Robo-advisors advertise a single advisory fee, usually a quarter of a percent. That number is real, and it is nowhere near the full cost. Here is what the machine is actually doing with your money, and where the rest of the bill hides."
---

Every robo-advisor comparison eventually collapses into one column: the advisory fee. Betterment and Wealthfront sit at 0.25%. Vanguard Digital Advisor comes in lower. Schwab Intelligent Portfolios charges zero. Read enough of these tables and you walk away believing the cheapest robo-advisor is the one charging the least, which is exactly what the tables are designed to make you believe.

The advisory fee is the one cost the provider controls completely and can therefore advertise precisely. The costs it does not control, or does not want to feature, are the ones that determine what you actually keep. Understanding a robo-advisor means understanding the whole stack, not the headline.

## What you are actually buying

Strip away the branding and a robo-advisor is two things: an allocation and a rule for maintaining it.

The allocation comes from an onboarding questionnaire about goals, time horizon, and risk tolerance, which maps you onto one of a few dozen preset model portfolios built from low-cost index ETFs. There is no security selection happening. You are getting a version of the same broad-market sleeves everyone else gets, weighted differently.

The rule is where the automation earns its keep. Markets push your 70/30 portfolio to 76/24, and the software rebalances it back. Most platforms use threshold rebalancing rather than calendar rebalancing: they define a drift band around each asset class and trade only when a holding breaks out of it. That is a meaningfully better design than "rebalance every January," because it trades when the portfolio needs it instead of when the calendar says so, and it avoids churn in quiet markets.

Fractional shares make this work at small balances. A $3,000 account cannot rebalance into whole shares of eight ETFs, but it can hold 0.4271 of one. Combined with cash-flow rebalancing, where new deposits get steered into whatever sleeve is underweight, most drift gets corrected without a taxable sale at all.

That is a genuinely useful service, executed without emotion, for a fraction of what a human charges. The question is what it costs in total.

## The costs that are not on the pricing page

Three layers sit underneath the advisory fee.

**Fund expense ratios.** The advisory fee buys the wrapper. The ETFs inside it charge their own management fees, typically 0.03% to 0.15% for index products. Those come out of fund NAV, so you never see a line item. They stack directly on top of the advisory fee.

**Cash allocation.** This is the one worth staring at. A mandatory cash position in a portfolio marketed as fully invested is a cost, and it can dwarf the advisory fee. In 2022, Schwab's subsidiaries paid $187 million to settle SEC charges that Schwab Intelligent Portfolios misled clients about exactly this. Between 2015 and 2018, the portfolios held cash allocations ranging from 6% for the most aggressive profiles to 24.9% for conservative ones, roughly 12.5% on average, swept to an affiliate bank that lent it out and kept the spread. Schwab's own analysis, per the SEC order, showed the cash drag left clients with lower returns under most market conditions while carrying the same risk. The advisory fee was zero. The product was not free.

**Spreads and internal trading.** Small but real, and larger on thinly traded sleeves like frontier markets or niche bond funds.

Here is the arithmetic on a $100,000 account at a 0.25% advisor:

```
Advisory fee          0.25%  =  $250
Fund expense ratios   0.08%  =  $ 80
Cash drag: 10% of the portfolio earning
2 points less than the rest
     0.10 x 2.00%    = 0.20%  =  $200
                              -------
Total                 0.53%     $530
```

The headline said $250. The drag said $530, and the biggest single contributor was the line nobody advertises.

## Tax features are real and usually quoted at their best case

Daily tax-loss harvesting is standard now, and direct indexing, which holds individual stocks instead of a fund so losses can be harvested at the security level, typically unlocks above a $100,000 balance. Both work. Both are narrower than the marketing implies.

Harvesting defers tax, it does not erase it. Selling a loser and buying a near-equivalent lowers your cost basis, so the deferred gain reappears at sale. The benefit is the time value of money on the deferral plus any rate arbitrage between the short-term losses you bank now and the long-term gains you realize later. That is worth something. It is not the same as free return, and published "tax alpha" figures assume a high marginal bracket, consistent realized gains to offset, and no wash-sale collisions with trades in your other accounts, which the robo cannot see. In a Roth IRA it is worth exactly nothing.

## Comparing them honestly

Add four numbers, not one: advisory fee, weighted average expense ratio of the underlying funds, the cash allocation multiplied by the yield you are giving up on it, and an honest discount on the advertised tax benefit for your actual bracket and account type. The provider's Form ADV Part 2A discloses the cash policy and the conflict behind it; it is dull and it is where the real answer lives.

Automated rebalancing at institutional scale for half a percent is a solid deal by any historical standard. Just make sure you know which half.

Sources: [SEC administrative proceeding 34-95087](https://www.sec.gov/enforcement-litigation/administrative-proceedings/34-95087-s), [CNBC on the Schwab settlement](https://www.cnbc.com/2022/06/13/charles-schwab-will-pay-187-million-to-settle-sec-robo-advisor-claims.html), [NerdWallet robo-advisor comparison](https://www.nerdwallet.com/investing/best/robo-advisors)
