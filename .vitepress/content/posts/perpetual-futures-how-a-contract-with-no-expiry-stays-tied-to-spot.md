---
date: "2026-11-14T02:16:12.000-08:00"
tags: ["finance", "crypto", "trading", "regulation", "perpetual-futures"]
draft: false
title: "Perpetual Futures: How a Contract With No Expiry Stays Tied to Spot"
image: "/images/posts/perpetual-futures-how-a-contract-with-no-expiry-stays-tied-to-spot.jpg"
topic: "finance"
description: "Perps never expire, so what keeps their price near spot? A walkthrough of funding rates, mark prices, and the liquidation engine behind crypto's biggest market."
---

A regular futures contract has a built-in deadline. On expiry day it settles against the real asset, so as that date approaches, the futures price and the spot price are forced together. Arbitrageurs make sure of it.

A perpetual future, or "perp," removes the deadline. You can hold a long or short bitcoin position indefinitely, with leverage, and never roll it into a new contract. That convenience is why perps dominate crypto trading volume. It also raises an obvious question: if nothing ever forces the contract to converge with spot, what stops its price from drifting off on its own? The answer is a small, recurring payment called funding, and understanding it explains most of what makes perps both useful and dangerous.

## Funding: the payment that replaces expiry

Every perp exchange tracks two prices. The **index price** is a blended spot price pulled from several exchanges. The **mark price** is a smoothed estimate of where the perp itself is trading, designed to resist one-off spikes. The gap between them is the **premium**.

At each funding interval, the side the market is crowding into pays the other side:

- Perp trading **above** spot (positive premium): longs pay shorts.
- Perp trading **below** spot (negative premium): shorts pay longs.

The exchange doesn't keep this money. Funding is a transfer between traders, which is the whole point: when too many people want to be long, holding a long gets more expensive and holding a short starts paying a yield. That pressure pulls the perp back toward the index. Formulas differ by venue. Binance-style contracts combine the premium with a small interest-rate term and clamp the result, while Coinbase's derivatives docs describe a damper of ±0.025% and a hard cap of ±5% per period. Intervals differ too: eight hours is common, and some venues settle hourly.

## Running the numbers

Funding rates look tiny because they're quoted per interval. Here is what one looks like over time.

Say bitcoin's index price is $100,000, and you go long one BTC worth of perp exposure ($100,000 notional) on a venue that charges funding every eight hours. The rate sits at +0.01% per interval, a fairly ordinary level in a bullish market.

| Period       | Funding paid by the long |
| ------------ | ------------------------ |
| One interval | $100,000 × 0.01% = $10   |
| One day (3×) | $30                      |
| One year     | about $10,950            |

That works out to roughly 11% a year, paid on the full notional, not on the margin you posted. If you used 10× leverage and posted $10,000, a year of steady funding at that rate would eat more than your entire deposit even if bitcoin's price never moved. Funding is a running cost, not a one-time fee, and in frothy markets rates can run several times higher than this example.

The flip side explains a popular market-neutral trade called **cash-and-carry**: buy spot bitcoin and short the same amount of perp. Price moves cancel out, and when funding is positive the short side collects it. It is not free money. Funding can flip negative, the two legs often sit on different venues, and exchange counterparty risk doesn't disappear because the position is hedged.

## Liquidation: the part of the machine that bites

Leverage means your margin is a thin cushion. With 10× leverage, a move of roughly 10% against you wipes out the posted margin, and in practice the exchange steps in a bit earlier, once your equity falls below the **maintenance margin**. Its liquidation engine then closes the position for you, using the mark price rather than the last trade so a single odd print can't trigger it.

The system works in calm markets. The stress case is a fast move into thin order books. Forced selling from one wave of liquidations pushes price into the next wave's trigger levels, and the cascade feeds itself. On October 10–11, 2025, a tariff headline set off exactly that: by most counts, more than $19 billion in leveraged positions were force-closed within about a day, the largest single liquidation event on record. When liquidations can't be filled at a price that covers the losing traders' debts, some venues fall back on **auto-deleveraging (ADL)**, closing _profitable_ positions on the other side to keep the exchange solvent. Several large exchanges did that during the October crash, which surprised traders who believed being on the winning side meant they were safe.

## Why this matters more in 2026

Until recently, perps were mostly offshore products that US customers couldn't legally touch. That changed in late May 2026, when the CFTC allowed the first one onto a US-regulated exchange: Kalshi's bitcoin perpetual. Coinbase received no-action relief to route US clients to Deribit's perps, starting with institutions, with retail access expected later. The guidance is a staff advisory rather than formal rulemaking, and new assets will be reviewed case by case, so the details may still shift.

Regulation changes who can access perps, not how they work. Whether you're weighing a perp or just reading a headline about "record liquidations," it helps to know the three parts of the machine: the funding payment that ties the price to spot, the mark price that decides when you're underwater, and the liquidation engine that closes you out once you are. For exact terms, the funding and margin pages in an exchange's own docs are the source of truth, and they vary more than most people expect.
