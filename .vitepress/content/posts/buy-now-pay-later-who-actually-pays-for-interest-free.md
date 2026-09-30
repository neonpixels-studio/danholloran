---
date: "2026-09-30T02:15:18.000-07:00"
tags: ["finance", "fintech", "payments", "regulation", "buy-now-pay-later"]
draft: false
title: "Buy Now, Pay Later: Who Actually Pays for Interest-Free"
image: "/images/posts/buy-now-pay-later-who-actually-pays-for-interest-free.jpg"
topic: "finance"
description: "Pay-in-four loans cost the shopper nothing when things go right, so someone else is paying. Here's how the BNPL money flows, why merchants eat the cost, and what changes as these loans start hitting credit reports."
---

Click "Pay in 4" at checkout and a $200 pair of shoes becomes four $50 payments, no interest, no hard credit pull, approved in about the time it takes to blink. Lending money costs something, so if the shopper isn't paying interest, who is?

The short answer is the merchant, mostly. The longer answer explains why BNPL grew so fast, why it's still small next to credit cards, and why 2025 and 2026 have been the years it started getting treated like real credit.

## The mechanics of pay-in-four

The BNPL product most people mean is **pay-in-four**: a short-term, zero-interest loan split into four equal installments. The first 25% is due at checkout, and the remaining three are pulled automatically from your card or bank account every two weeks. Six weeks later, you're done.

The flow looks like this:

1. You choose the BNPL option at checkout. The provider (Affirm, Klarna, Afterpay, PayPal, Sezzle, Zip) runs a quick eligibility check, usually a **soft inquiry** that doesn't affect your credit score.
2. If you're approved, the provider pays the merchant the full purchase price up front, minus a fee.
3. The provider now holds the loan and the **credit risk**. If you miss payments, that's the provider's problem, not the store's.

The merchant gets paid immediately, like a card sale, while the BNPL company quietly becomes your lender for six weeks.

## Follow the money: a worked example

Take that $200 purchase and trace where the dollars go.

**The merchant's side.** BNPL providers charge merchants a percentage fee, commonly in the **2% to 6% range plus a fixed per-transaction fee**, depending on the provider, volume, and loan terms. Standard card processing typically runs somewhere around 1.5% to 3%. Using round numbers:

- Card sale at ~2.5%: merchant receives about **$195**
- BNPL sale at ~5%: merchant receives about **$190**

So the merchant pays roughly twice as much to accept BNPL. Why would anyone agree to that? Because processors pitch it as a way to get larger orders and fewer abandoned carts. Take vendor numbers with some skepticism, but that's the bet retailers are making.

**The shopper's side.** If you pay on time, you pay $200 total. Compare that to putting $150 (the amount financed after the first installment) on a credit card you carry a balance on. With a 24% APR and a balance that falls from $150 to zero over six weeks, your average balance is about $100:

```
interest ≈ average balance × APR × (weeks / 52)
         ≈ $100 × 0.24 × (6 / 52)
         ≈ $2.77
```

Not a fortune, but for someone who already revolves card debt, BNPL is cheaper credit. The Richmond Fed makes the same point: for card revolvers, swapping in BNPL can lower borrowing costs.

**The provider's side.** Its revenue is that $10 merchant fee, plus late fees where allowed, plus interest on the longer-term, interest-bearing installment loans many of these companies also sell. The CFPB found that pay-in-four charge-off rates were **2.63% in 2022 and 1.83% in 2023**, compared with a bank credit card charge-off rate of 4.19% in late 2023. Short terms and small balances keep losses low.

## How big is it, really?

BNPL feels ubiquitous, but the numbers are modest. A February 2026 Richmond Fed economic brief estimates U.S. pay-in-four volume at roughly **$70 billion in 2025**, growing around 20% a year in real terms since 2021. That's about **1.1% of credit card spending**, which likely topped $6.3 trillion the same year.

Because each loan lasts six weeks and a quarter is paid up front, the brief estimates about **$3 billion** in BNPL debt outstanding at any moment, against roughly $1.23 trillion in credit card balances.

That doesn't mean it's risk-free for individuals. A 2025 LendingTree survey found **41% of BNPL users** made at least one late payment in the past year, up from 34% the year before. The real danger is **loan stacking**: four or five small plans from different providers, each one reasonable on its own, all drafting from the same checking account in the same week. Until recently, no credit bureau could see that pile-up.

## The rules are catching up

Two things are changing that.

**Credit reporting.** Affirm began reporting pay-in-four loans to Experian and TransUnion in 2025, and FICO introduced Score 10 BNPL and Score 10 T BNPL models built to read these loans. Other providers, including Klarna and Afterpay, have been more cautious, arguing that scoring models built for credit cards and mortgages may misread frequent small loans as risk. For consumers, on-time payments can now help a thin credit file, and missed ones may start to show up.

**Regulation.** Federal oversight has pulled back. The CFPB withdrew its 2024 interpretive rule treating BNPL lenders like credit card issuers in 2025. States are filling the gap. New York passed a Buy Now Pay Later Act in its 2025 budget, and in 2026 its Department of Financial Services proposed rules requiring BNPL lenders to be licensed, with disclosure requirements, dispute protections, and limits on fees. The law takes effect after those rules are finalized, so the details may still shift.

## The takeaway

"Interest-free" is accurate for the shopper who pays on time, because the merchant is paying the lender instead. The weak spot has always been visibility: small loans spread across providers where nobody sees the total. Credit reporting and state licensing are starting to close that gap. For a deeper look at the data, the Richmond Fed's [Buy Now, Pay Later: Recent Developments and Implications](https://www.richmondfed.org/publications/research/economic_brief/2026/eb_26-05) and the CFPB's [BNPL market report](https://www.consumerfinance.gov/data-research/research-reports/the-buy-now-pay-later-market/) are both worth reading.
