---
date: "2026-09-09T02:07:16.000-07:00"
tags: ["finance", "fintech", "embedded-finance", "payments", "banking"]
draft: false
title: "Embedded Finance: What It Actually Takes to Put a Bank Inside Your App"
image: "/images/posts/embedded-finance-what-it-takes-to-put-a-bank-inside-your-app.jpg"
topic: "finance"
description: "Scheduling apps issue debit cards now, and invoicing tools offer loans. Here is the three-layer stack underneath embedded finance, where the money actually comes from, and what the Synapse collapse changed about who has to keep the ledger."
---

A scheduling app for dog groomers issues debit cards. An invoicing tool for contractors offers a working capital loan on the same screen where you send the invoice. A checkout button says "pay in four" and approves you in under a second without you ever visiting a lender's website.

None of those companies are banks. All of them are, in a narrow and heavily supervised sense, distributing banking. That is embedded finance: financial products delivered inside software that is not, on its face, a financial product. The pitch is obvious enough. The part that gets glossed over is the stack underneath it, which determines who holds the license, who eats the loss, and who is legally obligated to know whose money is whose.

## Three layers, and only one of them has a charter

Every embedded experience sits on three layers.

At the bottom is the **sponsor bank**, a chartered institution (or an EMI in the EU) that holds the license, the balance sheet, and the regulatory accountability. It is the entity that actually has access to the payment networks and the FDIC relationship.

In the middle is the **banking-as-a-service platform**, which supplies APIs, ledgering, KYC tooling, card issuing, and the compliance workflow. This is the layer people mean when they say "we just plugged in an API."

On top is the **brand**, the app the customer opens. It owns the interface, the customer relationship, and the distribution.

The useful mental model: embedded finance is what the customer sees, and BaaS is the plumbing behind the wall. A platform can only offer a deposit account or a card because a chartered bank underneath it agreed to let that account exist. From the brand's side, integration really can look like this:

```js
// Create a cardholder and issue a virtual card through the BaaS layer
const account = await baas.accounts.create({
  externalId: groomer.id,
  type: "deposit",
  kycToken: verifiedIdentityToken, // KYC already cleared upstream
});

const card = await baas.cards.issue({
  accountId: account.id,
  form: "virtual",
  spendControls: { dailyLimit: 50_000 }, // cents
});
```

Twenty lines of TypeScript. Behind it, a bank examiner's checklist.

## Where the money comes from

Embedded finance revenue tends to come from three places: interchange on card transactions, an interest or fee share on lending, and float plus breakage on stored value.

Interchange is the one most platforms build around, and the math is less generous than it first sounds. Interchange on a standard credit transaction runs roughly 2 percent, and the platform sees only its negotiated share of that after the network, the issuer processor, and the sponsor bank take their cuts. A vertical SaaS pushing $50 million a year in card volume at, say, 80 basis points of net interchange is looking at about $400,000 in annual revenue. Real money for a small company, but not the windfall implied by "we're a fintech now," and it arrives with compliance overhead that scales with volume.

That gap is why the build-versus-partner question has a rough threshold attached to it. Industry guidance in 2026 puts sponsored card programs at meaningfully attractive economics somewhere north of $10 million in annual transaction volume. Below that, a referral arrangement or revenue share with an existing issuer usually returns more per dollar of engineering and compliance spend, because you skip the BIN sponsorship, the program manager duties, and the audit surface.

The category is large and growing fast either way. Estimates for 2026 put the global embedded finance market around $150 billion, with projections toward roughly $450 billion by the early 2030s. Large markets attract both good operators and thin ones.

## Synapse made the ledger the product

For a few years the risk in this stack was theoretical. Then Synapse, a middleware provider sitting between fintech apps and sponsor banks, collapsed in 2024, and it turned out the ledgers reconciling which end user owned which dollar in a pooled "for benefit of" account did not agree. Customers of apps that had never missed a payment found their balances frozen. FDIC insurance covers a bank failing. It does not cover a middleware company losing track of the beneficial owners.

The regulatory response was direct. The FDIC's October 2024 custodial recordkeeping proposal would require banks to maintain accurate beneficial-owner records for custodial accounts and reconcile individual balances daily. That proposal survived the March 2025 round of withdrawals and remained live through 2026, and the FDIC has also signaled interest in an independent standards body for bank-fintech partnerships. In practice, daily reconciliation and FBO transparency have already become table stakes in partnership diligence regardless of the rule's final form. Sponsor banks now expect audit rights over their fintech partners, and they exercise them.

## The takeaway

If you are evaluating an embedded finance product as a builder or as a user, the question worth asking is not "who made this app" but "who holds the money, and who can prove whose it is." The answer lives in the layer you cannot see from the interface. Start with the sponsor bank's name, which a well-run program discloses plainly, and the reconciliation cadence. Those two facts tell you more about the risk than any feature list will.
