---
date: "2026-11-07T16:23:40.000-08:00"
tags: ["finance", "fintech", "payments", "bnpl"]
draft: false
title: "Buy Now, Pay Later: Who Actually Pays for 'Interest-Free'"
image: "/images/posts/buy-now-pay-later-who-actually-pays-for-interest-free.jpg"
topic: "finance"
description: "Pay-in-4 plans charge shoppers no interest, so where does the money come from? A walk through BNPL economics, from merchant fees to credit losses to the regulators who still disagree on what it is."
---

Split a $400 jacket into four payments of $100 and nobody charges you a cent of interest. No APR, no finance charge, no fee if you pay on time. It feels like the lender is doing you a favor, and that should make you curious, because lenders do not hand out six-week loans for free.

They don't. Someone is paying for "interest-free," and for most pay-in-4 plans it is not the shopper. It is the store. Once you see buy now, pay later (BNPL) as a loan the merchant subsidizes, the whole industry makes a lot more sense, including why checkout pages push it so hard and why regulators spent years arguing about what it even is.

## The merchant discount is the business model

When you check out with a BNPL provider, the provider pays the merchant almost immediately, minus a fee called the merchant discount rate. You then repay the provider on a schedule, typically four installments two weeks apart, with the first due at purchase.

That merchant fee is meaningfully higher than what a card swipe costs. Industry estimates put BNPL merchant fees roughly in the 2% to 8% range, with many plans landing between 3% and 6%, while a typical US credit card transaction costs the merchant somewhere around 2% to 3%. Affirm's fiscal 2026 annual report, for the year ended June 30, 2026, puts its merchant network revenue at about $1.15 billion, or 2.3% of its $50.2 billion in gross merchandise volume. That blended figure is lower than headline pay-in-4 rates because it mixes in large merchants who negotiate hard and longer loans where the shopper pays interest instead.

Why would a store accept a fee that's double a card fee? Because the pitch is not "cheaper payments," it is "more sales." BNPL providers sell themselves on higher conversion rates and bigger average orders. A shopper who hesitates at $400 often says yes to "$100 today." Whether that trade actually pays off depends on a question the merchant can rarely answer cleanly: would this sale have happened anyway?

## A worked example: following the $400

Here is a simplified pay-in-4 purchase with a 4% merchant fee. These numbers are illustrative, not any specific provider's terms.

| Day | Event                                   | Provider cash position |
| --- | --------------------------------------- | ---------------------- |
| 0   | Pays merchant $384 ($400 minus $16 fee) | -$384                  |
| 0   | Collects your first $100                | -$284                  |
| 14  | Collects $100                           | -$184                  |
| 28  | Collects $100                           | -$84                   |
| 42  | Collects final $100                     | +$16                   |

The provider earns $16 over six weeks. That sounds small, but the money is only out for six weeks, and the average outstanding balance is roughly $180. Earning about $16 on $180 over six weeks works out to a gross annualized yield well north of 50%, before you subtract the things that make this hard:

- **Credit losses.** Some shoppers never pay the last installments. A few percent of losses wipes out a large share of that fee.
- **Funding costs.** The provider borrows the $384 from somewhere, usually warehouse credit lines or by selling loans to investors. When interest rates rise, this squeeze is immediate.
- **Fraud and operations.** Instant approvals at checkout are an attractive target.

That is why the economics of pay-in-4 are a volume game with thin margins. It is also why the larger players lean on longer-term loans with real interest. In the same Affirm filing, interest income, about $2.05 billion, was larger than merchant fees. "Interest-free" is the front door; interest-bearing loans are a large part of the house.

## Where the shopper does pay

For the consumer, the risk is not usually the interest rate. It is the structure:

- **Late fees** on some platforms, though policies differ widely (Affirm, for example, markets itself on charging none).
- **Loan stacking.** Four or five small plans across different apps can add up to a payment schedule that no single provider can see in full.
- **Overdraft collisions.** Autopay pulls from a checking account on fixed dates whether or not your paycheck has landed.

For years that stacking problem was made worse by thin credit reporting. That has been changing. Affirm began reporting pay-over-time loans, including Pay in 4, to Experian and TransUnion in 2025, and FICO has announced scoring models that incorporate BNPL data. The bureaus have been cautious about folding it into traditional scores, so how much a BNPL plan moves your score still depends on which model a lender uses.

## Regulators still disagree on what it is

The US and UK have gone in opposite directions. In 2024 the CFPB issued an interpretive rule treating BNPL providers like credit card issuers for dispute and refund rights. In 2025 it withdrew that rule and later said it would not issue a revised one, leaving states to fill gaps. The UK went the other way: interest-free BNPL, called "deferred payment credit," became regulated consumer credit on July 15, 2026, with affordability checks, clearer disclosures, and access to the Financial Ombudsman Service.

## The takeaway

Interest-free is a pricing decision, not a gift. On a short pay-in-4 plan the merchant usually funds your loan through a fee that is higher than a card swipe, and the provider bets that fee covers defaults, funding, and fraud. Knowing that does not make BNPL good or bad. It just tells you where the costs went, and it is a useful habit to ask that same question any time a financial product is advertised as free. If you want to dig further, the risk-factors section of any public BNPL provider's 10-K is a surprisingly readable map of everything that can go wrong.
