---
date: "2026-10-03T02:15:36.000-07:00"
tags: ["finance", "fintech", "payments", "compliance", "payment-rails"]
draft: false
title: "How ACH Actually Moves Money: Batches, Windows, and Nacha's 2026 Rules"
image: "/images/posts/how-ach-actually-moves-money-batches-windows-and-nachas-2026-rules.jpg"
topic: "finance"
description: "Why bank transfers take the time they do, how ACH files and settlement windows work, and what Nacha's 2026 fraud-monitoring rules changed for everyone sending payments."
---

Your paycheck shows up on Friday morning. Your rent "pending" sits in your banking app for two days. A transfer between your own accounts at two different banks somehow takes longer than a wire to another country. None of this is your bank being lazy. It is what happens when a huge share of the US economy still runs on a network built around batch files, and once you see how those batches move, the delays start to make sense.

That network is ACH, the Automated Clearing House. It carries payroll, bill pay, Venmo cash-outs, tax refunds, and most "pay by bank" checkouts. It is governed by Nacha, a private rule-making body, and cleared by two operators: the Federal Reserve's FedACH and The Clearing House's EPN. 2026 has been an unusually busy year for its rulebook, so it is a good moment to look under the hood.

## A payment is a line in a file, not a message

Card payments and instant rails like FedNow send one message per payment. ACH does not. Your employer's bank (the ODFI, or Originating Depository Financial Institution) collects thousands of payment instructions, bundles them into a fixed-width text file, and transmits it to an ACH operator. The operator sorts the entries by destination bank and hands each receiving bank (the RDFI) its own file.

Every entry is a 94-character line, and entries are grouped under a batch header that says who is paying and why. Here is a simplified sketch of building one, with the field positions from the Nacha spec:

```js
// Batch header record ("5" record): 94 fixed-width characters
const pad = (s, n) => String(s).padEnd(n, " ").slice(0, n);

const batchHeader = [
  "5", // 1      record type
  "220", // 2-4    service class: 220 = credits only
  pad("ACME CORP", 16), // 5-20   company name
  pad("", 20), // 21-40  discretionary data
  pad("1234567890", 10), // 41-50  company ID
  "PPD", // 51-53  SEC code: prearranged consumer payment
  pad("PAYROLL", 10), // 54-63  company entry description
  pad("", 6), // 64-69  descriptive date
  "261009", // 70-75  effective date (YYMMDD)
  "   ", // 76-78  settlement date, filled in by the operator
  "1", // 79     originator status code
  "12345678", // 80-87  ODFI routing ID (first 8 digits)
  "0000001", // 88-94  batch number
].join("");

console.log(batchHeader.length); // 94
```

That "company entry description" field is the text you see on your statement, and as we will see below, Nacha now dictates what goes in it for certain payments.

## Why it takes the time it takes

Because ACH moves in files, settlement happens on a schedule rather than continuously. The Federal Reserve publishes the FedACH processing schedule, and it has three Same Day windows. Files received by 10:30 a.m., 2:45 p.m., and 4:45 p.m. Eastern settle at 1:00 p.m., 5:00 p.m., and 6:00 p.m. Eastern that same day. Anything that is not sent as Same Day, or misses those windows, settles at 8:30 a.m. Eastern on a future business day.

So a "two-day" ACH transfer is often not two days of processing. It is a payment that was dated for a future settlement day, then waited on the receiving bank to post it. Same Day ACH has a per-payment cap, which has climbed from $25,000 at its 2016 launch to $1 million today. Nacha members voted in April 2026 to raise it to $10 million, effective September 17, 2027.

The other piece of the puzzle is returns. ACH is not final the way a FedNow payment is. A receiving bank can send most entries back within two banking days (insufficient funds, closed account), and a consumer can dispute an unauthorized debit for up to 60 days. That reversibility is a big reason businesses hold funds or delay shipping on bank payments, and it is a tradeoff: cheaper and gentler on consumers than wires, but slower to be truly "done."

A worked example: a gig platform pays a driver $300 on a Thursday. If it submits a Same Day file at 2:00 p.m. Eastern, the money settles between banks at 5:00 p.m. that day. If it submits a standard file that evening, settlement lands at 8:30 a.m. Friday. Starting September 18, 2026, Nacha requires receiving banks to make those standard credits available by 9:00 a.m. local time on the settlement date, regardless of when the file arrived the day before, which closes a gap where some funds were technically settled but not yet usable.

## What changed in 2026: everyone has to watch for fraud

The biggest 2026 change is about fraud. Before this year, Nacha only required a "commercially reasonable" fraud detection system for a narrow slice of payments: online consumer debits (the WEB code) and micro-deposits. ACH credits, which is exactly what business email compromise and payroll-redirect scams abuse, had no formal monitoring requirement.

The new rules roll that out in two phases. Since March 20, 2026, every originating bank and the largest originators and third-party processors (6 million or more entries in 2023) must run risk-based processes to spot entries that are unauthorized or "authorized under false pretenses." On June 19, 2026, the volume threshold disappeared, so every non-consumer originator is now covered. Receiving banks have parallel duties to watch incoming credits.

"False pretenses" has a specific definition: someone misrepresenting their identity, their authority to act for someone else, or who owns the account being credited. Think a spoofed vendor email that swaps in new bank details. It deliberately does not cover a product that never arrived; that is a dispute, not this rule.

The same package standardized two descriptions. Payroll credits must carry `PAYROLL`, and consumer online debits for physical goods must carry `PURCHASE`, giving receiving banks a consistent signal to monitor against. Notably, the rules do not prescribe a technology, and they do not require screening every entry one by one. They require a documented, risk-based process that gets reviewed at least annually.

## The takeaway

ACH is slow for structural reasons, not technical incompetence: it is a batch system optimized for cost and volume, with reversibility built in. The 2026 rules do not change that design; they layer accountability on top of it so the people sending files share responsibility for what is in them. If you want to go deeper, the Federal Reserve's [FedACH processing schedule](https://www.frbservices.org/resources/resource-centers/same-day-ach-resource-center/fedach-processing-schedule/) and Nacha's [new rules page](https://www.nacha.org/newrules) are the primary sources, and both are more readable than you would expect.
