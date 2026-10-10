---
date: "2026-10-10T02:15:25.000-07:00"
tags: ["finance", "crypto", "bitcoin", "blockchain", "bitcoin-fundamentals"]
draft: false
title: "Bitcoin's Security Budget: What Happens When Fees Are Under 1% of Miner Revenue"
image: "/images/posts/bitcoins-security-budget-what-happens-when-fees-are-under-one-percent.jpg"
topic: "finance"
description: "Bitcoin pays miners mostly with newly issued coins, a subsidy that halves every four years. In 2026 transaction fees cover less than 1% of that bill. Here's how the security budget works and why the fee share matters."
---

Bitcoin has no company, no treasury, and no security team on payroll. Its defense against someone rewriting the ledger is economic: miners spend real money on hardware and electricity to add blocks, and the network pays them for it. That payment is what people mean by Bitcoin's **security budget**, and the source of it is quietly changing.

The original design had a built-in handoff. Early on, miners would be paid mostly in freshly created coins. Over time, as that issuance shrank, transaction fees were supposed to take over. In 2026 that handoff looks further away than ever: by Glassnode data reported in August, fees made up about 0.69% of miner revenue, close to a ten-year low.

## Where miner revenue comes from

Every block a miner produces pays two things:

1. **The block subsidy**: new bitcoin created out of thin air. It started at 50 BTC in 2009 and halves every 210,000 blocks, roughly every four years. Since the April 2024 halving it has been **3.125 BTC per block**.
2. **Transaction fees**: whatever users attach to their transactions to get included in that block.

With a block about every ten minutes, that comes to roughly 144 blocks a day. Here is the math for a typical 2026 day:

| Component                  | Per block | Per day (≈144 blocks) |
| -------------------------- | --------- | --------------------- |
| Subsidy                    | 3.125 BTC | ≈450 BTC              |
| Fees (at ~0.7% of revenue) | ≈0.02 BTC | ≈3 BTC                |

A real data point backs this up. In the week ending December 29, 2025, miners earned about 3,166 BTC in total, and only around 16 BTC of that came from fees.

At a bitcoin price of about $77,000 (roughly where it traded in late August), 450 BTC a day works out to about $35 million in daily subsidy revenue. That money, minus electricity, hardware, and financing costs, is what keeps miners pointing hash rate at Bitcoin instead of switching their machines off.

## Why the halving schedule makes this a real question

The subsidy is not a policy anyone can vote to keep. It is written into the protocol and keeps halving:

| Era        | Approx. years | Subsidy per block | Subsidy per day |
| ---------- | ------------- | ----------------- | --------------- |
| Current    | 2024–2028     | 3.125 BTC         | ≈450 BTC        |
| Next       | 2028–2032     | 1.5625 BTC        | ≈225 BTC        |
| After that | 2032–2036     | 0.78125 BTC       | ≈112 BTC        |

Issuance trends toward zero, with the last fractions of a coin expected around 2140. Long before then, though, the subsidy gets small enough that its value in dollars depends almost entirely on price. Every four years the network effectively asks: **has the bitcoin price doubled, or have fees grown, enough to cover the cut?**

Historically, price has done most of that work. The trouble in 2026 is that the price has done the opposite. Reports put bitcoin down close to 50% from its October 2025 all-time high, and one analysis tied a roughly 33% drop in network hash rate from that peak to miners moving capacity to AI and high-performance computing. Miners measure their economics with **hashprice**, the gross revenue per petahash of computing power per day. Luxor's Hashrate Index recorded a record-low monthly average of about $30 in June 2026, before a price rebound pushed it toward $38 in late August.

## Can fees ever carry the load?

Fees are not always tiny. Demand for block space can spike hard: around the April 2024 halving, block 840,000 collected about 37.6 BTC in fees, more than six times the subsidy it was replacing. Busy stretches tied to Ordinals inscriptions and token launches briefly pushed the fee share far above today's levels.

The question is whether those spikes can become the baseline. There are a few competing views:

- **The optimistic case:** as bitcoin is used more as a settlement layer, with Layer-2 systems batching many payments into a few on-chain transactions, each of those transactions becomes valuable enough to carry a meaningful fee.
- **The skeptical case:** much of today's activity has moved off-chain or to cheaper networks, and a fee market that sits under 1% of revenue for nearly a year doesn't show organic demand for high-fee block space.
- **The "it adjusts" case:** a lower security budget doesn't break Bitcoin on its own. Mining difficulty adjusts, unprofitable miners leave, and the network keeps producing blocks. What falls is the _cost of attacking it_, and how much security is "enough" is an open debate.

None of these camps can prove its case yet. What you can measure is the trend: track the fee share of miner revenue alongside hashprice and hash rate. If fees stay under a percent as the 2028 halving gets closer, the gap between the theory and what is actually happening gets harder to ignore.

## The takeaway

Bitcoin's security isn't free. Today it is paid for almost entirely by new issuance, and that issuance is scheduled to keep shrinking. That doesn't make a crisis inevitable, but it does make the fee share of miner revenue one of the more useful long-term health signals for the network. To watch it yourself, Glassnode, mempool.space, and Luxor's Hashrate Index all publish the data. Look past the price chart to see who is actually paying for the blocks.
