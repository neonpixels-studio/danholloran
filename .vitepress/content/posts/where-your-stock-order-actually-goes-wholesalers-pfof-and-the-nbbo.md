---
date: "2026-10-07T02:15:27.000-07:00"
tags: ["finance", "markets", "trading", "stocks", "market-structure"]
draft: false
title: "Where Your Stock Order Actually Goes: Wholesalers, PFOF, and the NBBO"
image: "/images/posts/where-your-stock-order-actually-goes-wholesalers-pfof-and-the-nbbo.jpg"
topic: "finance"
description: "Most retail stock orders in the US never touch an exchange. Here is how wholesalers, payment for order flow, and the NBBO decide what price you actually get, and what changed in 2026."
---

When you tap "buy" in a commission-free brokerage app, it is natural to picture your order landing on the New York Stock Exchange or Nasdaq. For most US retail orders, that is not what happens. A typical marketable order from a retail account is sent to a firm you have probably never thought about, a wholesale market maker, which fills it from its own inventory in a fraction of a second. The exchange never sees it.

That is not a secret. It is the plumbing that makes $0 commissions possible, and it comes with real tradeoffs that regulators on both sides of the Atlantic are still arguing about.

## Three pieces: the NBBO, the wholesaler, and the payment

Start with the benchmark. The **NBBO** (National Best Bid and Offer) is the highest price anyone is currently bidding and the lowest price anyone is currently offering for a stock, consolidated across every US exchange. Under Regulation NMS, a broker owes you "best execution," and in practice the NBBO is the floor that any fill has to meet or beat.

Next, the **wholesaler**. Firms like Citadel Securities, Virtu Financial, and G1 Execution Services agree to fill retail orders themselves rather than routing them to an exchange. They take the other side of your trade and aim to earn a sliver of the bid-ask spread.

Finally, **payment for order flow (PFOF)**: the wholesaler pays your broker a small amount per share or per order for the right to handle that flow. This is the revenue that replaced commissions. You are not charged a fee, but your broker is paid on the back end by whoever fills you.

Why pay for orders? Retail flow is, on average, less "informed" than institutional flow. Someone buying 100 shares is rarely trading on news that moves the price in the next few seconds, so the market maker faces less risk and can afford to share some of the spread.

## A worked example

Here is a hypothetical, simplified trade to make the mechanics concrete.

- Stock XYZ has an NBBO of **$50.00 bid / $50.04 offer**. The spread is 4 cents.
- You send a market order to buy 100 shares.
- Your broker routes it to a wholesaler, which fills you at **$50.03**.

Compared with buying at the $50.04 offer, you received 1 cent of **price improvement** per share, or $1.00 on the trade. Suppose the wholesaler pays your broker $0.002 per share for the order, which is $0.20. The wholesaler now holds a short position it sold at $50.03 and hopes to buy back closer to the $50.02 midpoint or the bid over the following moments, across thousands of offsetting orders.

Everyone appears to win: you beat the quoted price, your broker earned $0.20, and the wholesaler earned whatever spread it captured. The critique is about the counterfactual. The NBBO only reflects displayed quotes on exchanges, which are often thin, and the question regulators keep asking is whether you could have gotten an even better price if your order had competed openly instead of being sold to a single buyer. The payment to the broker also creates a conflict of interest: a broker might favor the wholesaler that pays more over the one that improves prices more.

## What changed in 2026

Three developments make this a live topic this year.

**Better execution data.** The SEC's amended Rule 605 took effect on August 1, 2026, after the compliance date was pushed back from December 2025. It extends execution-quality reporting from market centers to larger broker-dealers, requires timing data in milliseconds or finer, and adds more detail on spreads and price improvement. The first monthly reports, covering August 2026, were due by the end of September. For the first time, you can compare brokers on a reasonably standardized basis rather than relying on their marketing.

**Market structure rules on hold.** In 2024 the SEC adopted a half-penny ($0.005) minimum quoting increment for tightly traded stocks and cut the exchange access-fee cap from 30 mils to 10 mils per share. Narrower ticks would make the NBBO itself tighter, shrinking the room in which "price improvement" happens. Those changes have now been deferred twice: first to November 2026, and in June 2026 to November 2027, while the SEC reviews them. In the same move, the Commission proposed rescinding Rule 611, the "order protection" rule that prevents trades from executing at prices worse than a protected quote elsewhere. If that repeal goes through, the plumbing described above will shift again.

**Europe went the other way.** The EU banned PFOF under its MiFIR review, with a transition period for member states that allowed it. That window closed on June 30, 2026, and Germany, home to several large neobrokers, has enforced the ban since July 1. The US and EU are now running a live experiment on whether zero-commission investing survives without PFOF, and which model gets retail investors better all-in prices.

## The takeaway

The useful mental shift is to stop thinking of commission-free trading as free and start thinking of it as priced differently. Your cost lives in the execution price, not in a line item. If you trade often, a limit order removes much of the uncertainty about where you get filled, and the new Rule 605 reports give you real data on how your broker's executions compare. Your broker's quarterly Rule 606 routing report, which lists where orders go and what the broker is paid, is the other primary source worth reading.
