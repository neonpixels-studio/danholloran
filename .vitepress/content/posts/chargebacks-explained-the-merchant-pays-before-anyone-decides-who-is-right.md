---
date: "2026-11-18T02:14:41.000-08:00"
tags: ["finance", "fintech", "payments", "fraud", "chargebacks"]
draft: false
title: "Chargebacks Explained: The Merchant Pays Before Anyone Decides Who's Right"
image: "/images/posts/chargebacks-explained-the-merchant-pays-before-anyone-decides-who-is-right.jpg"
topic: "finance"
description: "A chargeback pulls money from the merchant on day one and decides fault months later. Here is how the dispute pipeline works and what it costs."
---

Most people picture a chargeback as a refund with extra steps: you call your bank, say the package never arrived, and the money comes back. From the cardholder's side, that is roughly right. From the merchant's side, it looks very different. The money leaves their account the moment the dispute is filed, a fee leaves with it, and the question of who was actually right gets answered weeks or months later by a bank the merchant never talks to directly.

That ordering, pay first and argue later, is the whole design, and it explains the fees, deadlines, and evidence rules that follow.

## Why the cardholder gets the benefit of the doubt

In the US, the floor for card disputes is set by law. The Fair Credit Billing Act, implemented in Regulation Z (12 CFR 1026.13), gives credit cardholders 60 days after the statement showing a "billing error" to send a written dispute. Billing errors include unauthorized charges and goods or services that were not delivered as agreed. The issuer must investigate within set deadlines and cannot collect the disputed amount meanwhile.

The card networks then layer their own, more generous rules on top. Visa and Mastercard typically let cardholders file within 120 days of the transaction, and for prepaid future events such as flights, hotel stays, or concert tickets, the clock usually starts on the event date rather than the purchase date. Debit cards fall under a different rule, Regulation E, for unauthorized transfers, and lean on network rules for most other disputes.

The issuer, the cardholder's bank, is the one that decides. It has a customer relationship to protect and a legal obligation to act, so it pulls the money back through the network first. The **acquirer** (the merchant's bank or payment processor) is debited, and the acquirer debits the merchant. Only then does the merchant get a chance to respond.

## The timeline, step by step

Here is how a typical card-not-present dispute plays out, using the windows Stripe documents for its merchants:

1. **Early fraud warning (optional).** Issuers report suspected fraud to the networks (Visa's TC40, Mastercard's SAFE reports). Processors surface these as early warnings. Stripe says about 40% of Visa and Mastercard early fraud warnings become formal fraud disputes if the merchant does nothing.
2. **Chargeback filed.** The disputed amount plus a dispute fee comes out of the merchant's balance. The merchant can no longer issue an ordinary refund for that charge.
3. **Merchant response.** Usually 7 to 21 days, depending on the network. Submitting evidence is called **representment**. Doing nothing counts as accepting the loss.
4. **Issuer review.** Usually 60 to 75 days. The issuer reads the evidence and decides.
5. **Optional escalation.** Some disputes can go to pre-arbitration or network arbitration, which adds more time and more fees.

End to end, two to three months is normal.

On the developer side, the dispute arrives as a webhook. With Stripe, a minimal handler that captures the deadline might look like this:

```js
// POST /webhooks/stripe
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  endpointSecret,
);

if (event.type === "charge.dispute.created") {
  const dispute = event.data.object;
  const dueBy = new Date(dispute.evidence_details.due_by * 1000);

  await queueDisputeReview({
    disputeId: dispute.id,
    chargeId: dispute.charge,
    amount: dispute.amount, // in the smallest currency unit
    reason: dispute.reason, // e.g. 'fraudulent', 'product_not_received'
    dueBy,
  });
}
```

The `due_by` timestamp is the number to put in front of a human. Missing it is the most common way merchants lose disputes they could have won.

## The math of fighting back

Fees turn every dispute into a small cost-benefit calculation. Stripe's current US pricing (updated in June 2025) charges $15 when a dispute is received, which is not returned even if you win, and another $15 if you counter it, which _is_ returned on a win.

Take an $80 order where the goods cost the merchant $30 and have already shipped:

| Outcome            | Lost compared to a normal sale |
| ------------------ | ------------------------------ |
| Accept the dispute | $80 + $15 = **$95**            |
| Counter and win    | **$15** (received fee only)    |
| Counter and lose   | $80 + $15 + $15 = **$110**     |

In the two losing rows, the $30 of goods is gone too, since the product shipped and the payment for it did not stick.

Countering only makes sense when the evidence is strong; a weak case that loses costs more than giving up.

Visa's **Compelling Evidence 3.0** rules are an attempt to tilt the fraud category toward merchants who do have data. For a card-not-present fraud dispute, a merchant that can show prior undisputed transactions from the same card, older than 120 days and sharing identifiers such as IP address or device ID, can shift liability back to the issuer. That is aimed squarely at **friendly fraud**: a real cardholder who made the purchase and then disputes it as unauthorized.

## Why dispute rates matter more than any single dispute

The quieter cost is the ratio. Networks run monitoring programs that track each merchant's disputes and fraud reports against its transaction count. Visa's current version is the Visa Acquirer Monitoring Program (VAMP). Cross the threshold and the merchant, and its acquirer, face fines, remediation plans, and in the worst case, losing the ability to accept cards.

This is why the sensible playbook is mostly about prevention: a recognizable statement descriptor, easy refunds, clear cancellation flows for subscriptions, delivery tracking, and 3D Secure on risky transactions, which can shift fraud liability to the issuer. Fighting a chargeback is the last line, not the first.

If you build anything that takes card payments, read your processor's dispute docs before your first one arrives. The rules are not intuitive, the deadlines are short, and the costs start counting the moment the issuer pushes the button.
