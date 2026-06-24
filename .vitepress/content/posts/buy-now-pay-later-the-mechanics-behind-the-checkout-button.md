---
date: '2026-06-24T07:08:57.000+00:00'
tags: ['finance', 'fintech', 'payments', 'bnpl', 'embedded-finance']
draft: true
title: "Buy Now, Pay Later: The Mechanics Behind the Checkout Button"
image: '/images/posts/buy-now-pay-later-the-mechanics-behind-the-checkout-button.jpg'
topic: 'finance'
description: "BNPL looks simple at checkout, but the plumbing underneath is surprisingly complex. Here's how providers actually make money, and where the risks sit."
---

You've seen it hundreds of times at checkout: "Pay in 4 interest-free installments." You click it, get instant approval, and walk away with your purchase. The merchant gets paid in full. You pay a quarter of the price every two weeks. Everybody wins — right?

The reality is a bit more layered. Buy Now, Pay Later (BNPL) has become one of the fastest-growing payment products in the world, hitting roughly 380 million global users and accounting for 5–6% of all ecommerce transactions in 2026. But the business model underneath it is worth understanding, especially as regulators on three continents are now paying close attention.

## How the Transaction Actually Works

When you select BNPL at checkout, a surprisingly fast sequence of events fires off in the background. The BNPL provider — Affirm, Klarna, Afterpay, or whichever service is embedded — runs a real-time credit assessment. This isn't a full hard credit pull in most cases; it's a lightweight check that often considers spending patterns, bank data, or a proprietary scoring model rather than a traditional FICO score.

If you're approved, the BNPL company pays the merchant in full, immediately. The merchant gets 100% of the sale price minus a fee. You owe the BNPL provider — not the merchant — for the remaining installments.

That's the core mechanic: the BNPL company is acting as a credit intermediary. It's extending short-term credit to you, absorbing the repayment risk, and paying the merchant upfront. The merchant effectively sells that receivable (your future payments) to the BNPL provider at a small discount.

## Where the Money Comes From

"Interest-free" is technically accurate for the pay-in-4 model — you pay no interest if you pay on time. But the BNPL provider isn't running a charity. There are three main revenue streams:

**Merchant fees** are the backbone. Merchants pay somewhere between 1.5% and 3% per transaction to accept BNPL. That's higher than a standard credit card's ~2%, but merchants often accept it because BNPL demonstrably increases average order value and conversion rates. A consumer who might not buy a $300 item outright is more likely to click through if it's $75 today.

**Late fees** kick in when consumers miss a payment. These vary by provider and jurisdiction, but they represent a secondary revenue stream that grows as the user base scales.

**Interest on extended plans** is the third lever. "Pay in 4 over 6 weeks" is interest-free, but "pay over 12 or 24 months" is not. Longer-term BNPL products carry interest rates that can run 15–24% per annum — competitive with credit cards, not better. The marketing emphasis on short-term, interest-free plans can obscure the fact that many providers also offer these higher-APR products.

## The Risk Picture

For consumers, the obvious risk is BNPL stacking. Because most short-term BNPL plans don't appear on traditional credit reports, it's possible — and common — to hold multiple simultaneous BNPL plans across different providers without any single lender knowing the aggregate exposure. Research from 2026 shows nearly 60% of 18–28-year-old BNPL users carry two to five active plans at once. That works fine when everything is stable. It can unravel quickly during a job loss or income disruption.

For providers, the credit risk is concentrated in a customer segment that is younger, thinner-file (less credit history), and more sensitive to economic downturns. Default rates have been creeping up: EU markets saw BNPL defaults hit 9% in 2025, and US projections for 2026 range from 8–12% according to CFPB data. These aren't catastrophic numbers, but they're higher than the product's early-adopter phase suggested.

Regulatory pressure is arriving on multiple fronts. The UK's Financial Conduct Authority (FCA) brings BNPL formally under credit regulation starting July 2026, requiring affordability assessments and standardized disclosures. The US Consumer Financial Protection Bureau (CFPB) has classified BNPL as credit, which means providers must now offer credit reporting and dispute rights similar to credit cards. The EU's PSD3 framework integrates BNPL into open banking rules, adding cross-border licensing requirements.

None of this kills the product — it just matures it. BNPL is moving from a regulatory gray area toward a more conventional credit product with consumer protections attached.

## What It Means Going Forward

BNPL has earned its place in the checkout flow. It genuinely reduces friction for consumers and increases conversion for merchants. The mechanics work. The open questions are around what "interest-free" actually means in practice when extended plans exist, how regulators will reshape disclosure requirements, and whether providers can maintain economics as default rates rise.

If you're a developer building payment flows, BNPL integration is increasingly a table-stakes feature rather than an advanced option — most major providers offer clean APIs and SDKs that plug into existing checkout infrastructure with minimal overhead. If you're a curious consumer, it's worth reading the fine print on any plan longer than six weeks before assuming "interest-free" applies all the way through.
