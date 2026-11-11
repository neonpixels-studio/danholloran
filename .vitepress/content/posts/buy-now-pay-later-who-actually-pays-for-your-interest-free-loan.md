---
date: "2026-11-11T02:14:57.000-08:00"
tags: ["finance", "fintech", "payments", "compliance", "buy-now-pay-later"]
draft: false
title: "Buy Now, Pay Later: Who Actually Pays for Your Interest-Free Loan"
image: "/images/posts/buy-now-pay-later-who-actually-pays-for-your-interest-free-loan.jpg"
topic: "finance"
description: "Pay-in-4 looks like free money, but somebody pays. Here is how BNPL economics work, why merchants foot the bill, and why the loans are so hard to see."
---

The checkout button says "4 interest-free payments of $50." No interest, no fees if you pay on time, no hard credit pull. It sounds like a loophole in how lending is supposed to work. Lenders are not charities, so if the shopper is not paying for the credit, someone else is.

That someone is mostly the merchant. Understanding why a store would happily pay more to accept Buy Now, Pay Later (BNPL) than to accept a credit card explains most of what is interesting about the product, including its blind spots.

## The merchant is the customer

A standard pay-in-4 plan splits a purchase into four equal installments: 25% at checkout, then three more payments every two weeks. The BNPL provider pays the merchant up front (minus a fee) and takes on the job of collecting the rest from you.

That fee is called the merchant discount rate, and it is steep compared with cards. Published and reported rates for the big U.S. providers generally land somewhere between about 2% and 8% of the order, often with a flat per-transaction charge on top. Card processing usually costs a merchant closer to 2% to 3%.

Here is a worked example using a round 6% plus $0.30, a figure in the reported range for large providers:

```text
Order total:                $200.00
Merchant fee (6% + $0.30):   $12.30
Merchant receives:          $187.70

Shopper pays:  $50 today, $50 at week 2, $50 at week 4, $50 at week 6
```

Why give up $12.30 instead of the roughly $5 a card swipe might cost? Because the provider is selling more sales, not just processing. Smaller chunks tend to raise conversion and order size, and BNPL apps double as shopping destinations. The fee is closer to a customer acquisition cost than a processing cost.

## Why a six-week loan can be very profitable

Look at it from the lender's side. It sends the merchant $187.70 and immediately collects your first $50, so it has $137.70 at risk. That balance drops to $87.70 after two weeks and $37.70 after four, before the final payment clears it.

On average the lender has about $87.70 outstanding for six weeks and earns $12.30 for it. That is roughly a 14% return over six weeks, which works out to around 120% on a simple annualized basis, before subtracting credit losses, funding costs, and operations. Short duration is the secret. The money turns over many times a year, and each turn earns another merchant fee.

Two other revenue streams fill in the picture:

- **Interest-bearing plans.** Longer financing (monthly payments over 6 to 36 months) often does carry an APR, sometimes high double digits. Pay-in-4 gets the headlines, but these loans are a large part of the business for providers like Affirm.
- **Late fees.** Policies vary a lot by provider. Some charge none, others charge a flat fee or a capped percentage of the order.

The loans themselves are funded through bank warehouse lines, securitizations, and forward-flow deals where investors buy loans as they are made. That makes the model sensitive to interest rates and investor appetite, not just to whether shoppers pay on time.

## The phantom debt problem

Historically, pay-in-4 loans mostly did not show up on credit reports. Each provider saw its own loans to you, but not the ones open with three other apps. Researchers call this "phantom debt": real obligations invisible to the rest of the credit system.

That is changing slowly and unevenly:

- **Scoring models exist.** FICO introduced FICO Score 10 BNPL and FICO Score 10 T BNPL in June 2025, designed to factor in BNPL repayment history.
- **Data furnishing is patchy.** Affirm reports its pay-over-time products to Experian and TransUnion. Other major providers have been reported as still declining to furnish pay-in-4 data to U.S. bureaus, so a score can only reflect what lenders actually send.
- **Lenders choose the model.** A new score version does nothing until mortgage, auto, and card lenders adopt it, which historically takes years.

For a borrower, this cuts both ways. On-time BNPL payments may start to help a thin credit file, and missed ones may start to hurt in places they did not before.

## The regulatory pendulum

Federal policy has swung back and forth. In May 2024 the CFPB issued an interpretive rule treating BNPL lenders like credit card issuers under the Truth in Lending Act, which would have brought dispute and refund rights along with it. In May 2025 the bureau withdrew that rule and said it would not prioritize enforcing it.

States are filling the gap. New York passed a Buy Now, Pay Later Act that requires BNPL lenders to be licensed and ties their charges to the state's usury limits, and the state's financial regulator (NYDFS) proposed detailed implementing rules in early 2026, covering both interest-free and interest-bearing products. Expect other states to borrow from that template, and expect some of the compliance cost to show up in merchant fees over time.

## The practical takeaway

BNPL is not free money, and it is not a scam. It is a credit product where the merchant pays most of the cost because it is buying sales, and the lender profits by turning short loans over quickly. The parts worth watching are the edges: returns that are slow to reach your payment schedule, interest-bearing plans behind the same checkout button, and stacked plans across apps that cannot see each other. For more depth, the CFPB's 2022 BNPL market report and New York's NYDFS rulemaking are good primary sources.
