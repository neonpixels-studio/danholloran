---
date: "2026-10-28T02:15:19.000-07:00"
tags: ["finance", "fintech", "payments", "buy-now-pay-later"]
draft: false
title: "Who Actually Pays for Buy Now, Pay Later?"
image: "/images/posts/who-actually-pays-for-buy-now-pay-later.jpg"
topic: "finance"
description: "Pay-in-four looks free to the shopper, so the money has to come from somewhere. Here is how BNPL providers earn, fund their loans, and why the regulatory picture shifted in 2025 and 2026."
---

You click "Pay in 4" at checkout, split a $400 order into four $100 payments, and pay no interest. Nobody charged you a fee. The merchant still got paid. So where does the money come from?

That question is the whole business model of buy now, pay later (BNPL), and once you see the moving parts, the tradeoffs get much easier to reason about.

## The merchant pays, and pays more than for a card

In a standard pay-in-four transaction the BNPL provider pays the merchant the full order amount up front, minus a fee, then collects the installments from the shopper over about six weeks. The provider takes on the credit risk. If you stop paying, that is the provider's problem, not the store's.

That fee is called the **merchant discount rate** (MDR), and it is the core revenue line. Published estimates for 2026 put typical BNPL merchant fees somewhere in the 2% to 8% range depending on provider, volume, and loan length, which is well above typical card processing costs. Affirm's fiscal 2026 annual report gives a harder number: merchant network revenue was about 2.3% of gross merchandise volume, down slightly from 2.4% the year before, as more volume shifted to its own card and interest-bearing products.

Here is a worked example on that $400 order:

|                          | Credit card        | BNPL (pay in 4)    |
| ------------------------ | ------------------ | ------------------ |
| Assumed merchant fee     | ~2.5%              | ~5%                |
| Merchant receives        | $390               | $380               |
| Who carries default risk | Card issuer        | BNPL provider      |
| Shopper interest         | Depends on balance | $0 if paid on time |

Why would a merchant give up an extra $10? Because BNPL providers sell themselves on conversion and basket size. If splitting the payment turns a hesitant $400 cart into a completed sale, or nudges a $300 cart to $400, the higher fee can pay for itself. If it does not, the merchant is just paying more for the same sale.

## The rest of the revenue: interest, late fees, and the card

Pay-in-four is the headline product, but it is not the only one. Providers also offer longer plans, often 6 to 36 months, and many of those carry interest. Those loans earn more per dollar and typically come with lower merchant fees, because the shopper is now paying for the credit instead of the store.

Then there are late fees. Most pay-in-four plans charge a flat fee when an installment is missed. They are usually capped per order by the provider or by state law, but on a $100 installment even a small fixed fee is a high effective cost of credit.

Providers have also pushed into their own cards and apps, which earn interchange (the fee paid on each card swipe) and lean more on interest than on merchant fees.

## How a BNPL lender funds its loans

A provider that pays merchants up front needs a lot of cash. Most are not banks, so they borrow against the loans themselves: warehouse credit lines from banks, and asset-backed securities (ABS), where a pool of consumer loans is packaged and sold to investors. In a March 2026 earnings call Affirm described upsizing one securitization from $500 million to $750 million because of investor demand.

Short loan terms make this work. A six-week loan pays back fast, so the same dollar can be lent out again and again. Roughly:

```
52 weeks / 6 weeks per loan ≈ 8.7 turns per year
1 dollar of funding ≈ $8.70 of pay-in-four volume per year
```

That rapid turnover is what lets a 2% to 5% merchant fee cover funding costs, losses, and operations. It also means BNPL economics are sensitive to interest rates and to credit markets staying open.

## The credit-reporting gap, and what regulators did about it

For years, most pay-in-four loans did not show up on credit reports. That created a blind spot: a shopper could stack several BNPL plans across different providers, and none of the lenders could see the others. FICO responded in June 2025 by announcing FICO Score 10 BNPL and 10 T BNPL models that can account for this data, but lender adoption has been slow because many still use older score versions, and not every provider furnishes pay-in-four data to the bureaus.

The federal rules moved the other way. In May 2024 the CFPB issued an interpretive rule treating pay-in-four lenders like credit card issuers under the Truth in Lending Act, which would have meant dispute and refund rights similar to cards. On May 12, 2025, the agency withdrew that rule along with other guidance documents, and it later said it does not plan to issue a revised version. States have started filling the gap, with New York publishing its own BNPL framework in 2026, and outside the US the UK has moved BNPL under formal FCA consumer-credit regulation.

## The takeaway

BNPL is not free money. It is a short-term loan that the merchant subsidizes, funded by investors who buy bundles of those loans, with late fees and interest-bearing plans filling in the margin. For shoppers, the practical risks are missed-payment fees, weaker protections than a credit card in the US, and the ease of stacking plans that no single lender can see. If you want to dig further, Affirm's annual 10-K is one of the clearest public explanations of how the model works, written by a company that has to disclose its numbers.
