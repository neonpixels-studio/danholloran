---
date: "2026-10-14T04:18:00.000-05:00"
tags: ["finance", "crypto", "bitcoin", "regulation", "perpetual-futures"]
draft: false
title: "Perpetual Futures: How Funding Rates Keep a Contract With No Expiry Honest"
image: "/images/posts/perpetual-futures-how-funding-rates-keep-a-contract-with-no-expiry-honest.jpg"
topic: "finance"
description: "Perpetual futures are the most traded product in crypto, and they never expire. Here's how the funding rate keeps them pinned to spot, what it costs to hold one, and why leverage makes the math unforgiving."
---

If you have looked at crypto trading volume, you have probably noticed something odd: most of it does not happen in the spot market where people actually buy and sell coins. It happens in a derivative called the **perpetual future**, or "perp." On busy days, perp volume dwarfs spot volume by several times.

A traditional futures contract has an expiration date. On that date it settles, and the futures price has to meet the spot price. A perp has no expiration date at all. That raises an obvious question: if nothing ever forces the contract to settle, what stops its price from drifting wherever traders push it? The answer is a small, recurring payment called the funding rate, and understanding it explains both why perps are so popular and why they blow up so many accounts.

## The funding rate is a tug back toward spot

A perp is a contract that tracks the price of an asset, say Bitcoin, without you owning the Bitcoin. You can go long (profit if the price rises) or short (profit if it falls), usually with leverage, meaning you post only a fraction of the position's value as collateral, called margin.

Because there is no settlement date, exchanges use funding to keep the perp price close to an index of spot prices. Every few hours, traders on one side of the market pay traders on the other:

- When the perp trades **above** spot, funding is positive and **longs pay shorts**.
- When the perp trades **below** spot, funding is negative and **shorts pay longs**.

The payment goes between traders, not to the exchange. The logic is a nudge: if too many people want to be long and the perp gets pricey, holding a long gets expensive and holding a short gets paid. Some longs close, some shorts open, and the gap narrows.

A common formula, used by Binance and copied widely, combines a **premium index** (how far the perp is trading from spot) with a small baseline interest component of 0.01% per eight-hour period, clamped so the adjustment can only move so far. Intervals vary by venue. Eight hours is the classic default. Hyperliquid, an on-chain perp exchange, charges funding hourly. Coinbase's U.S. perpetual-style futures, which launched on its CFTC-regulated derivatives exchange in July 2025 with up to 10x leverage, accrue funding hourly and settle it twice a day. (Technically those U.S. contracts are futures that expire every five years, a regulatory workaround that makes them behave like perps.)

## What holding a perp actually costs

Here is the part that surprises people. Funding is charged on the **full position size**, not on your margin.

Say Bitcoin is at $100,000 and you open a 1 BTC long using 10x leverage. You post $10,000 of margin to control a $100,000 position. At the baseline rate of 0.01% per eight hours:

|                             | Per period | Per day | Per year (approx.) |
| --------------------------- | ---------- | ------- | ------------------ |
| Funding at 0.01% / 8h       | $10        | $30     | $10,950            |
| As % of your $10,000 margin | 0.1%       | 0.3%    | ~110%              |

That "boring" baseline rate works out to roughly 11% a year on the position, which is more than 100% a year relative to the cash you actually put up. In a frothy market, funding can run several times higher than the baseline. Holding a leveraged long through a euphoric month can cost a meaningful chunk of your margin even if the price goes nowhere.

The flip side is a trade called **cash-and-carry**: buy 1 BTC on the spot market and short 1 BTC of the perp. Price moves cancel out, and when funding is positive you collect it. It is often pitched as market-neutral yield, and in calm conditions it mostly is. The risks live elsewhere: funding can turn negative and flip the payment against you, the short leg can still get liquidated if its collateral runs thin during a spike, and you are trusting the exchange holding both legs.

## Leverage turns small moves into forced exits

Leverage is what makes perps both attractive and dangerous. With 10x leverage, a roughly 10% move against you wipes out your margin. In practice it happens sooner, because exchanges require a **maintenance margin** buffer. When your equity falls below that line, the exchange's liquidation engine closes the position for you, at whatever price the market offers.

That mechanism is what turned October 10, 2025 into the largest liquidation event in crypto history. After a tariff announcement hit markets late on a Friday, more than $19 billion of leveraged positions were forcibly closed within about a day, according to Coinglass data cited by [CoinGecko](https://www.coingecko.com/learn/october-10-crypto-crash-explained), and the overwhelming majority were longs. [FTI Consulting](https://fticonsulting.com/insights/articles/crypto-crash-october-2025-leverage-met-liquidity) reported that Bitcoin's top-of-book order book depth shrank by more than 90% on key venues as market makers pulled back. Each liquidation was a forced sell, which pushed prices lower, which triggered the next liquidation.

When liquidations outran exchanges' insurance funds, some venues fell back on **auto-deleveraging (ADL)**, which closes part of _profitable_ traders' opposing positions to cover the shortfall. That means even a trader who was right about the direction could have a winning position cut short. It is an under-appreciated risk of perps: your counterparty is effectively the whole pool of traders, and in a disorderly market the venue's rules decide who absorbs the losses.

## The takeaway

Perpetual futures solved a real problem: they give traders continuous, leveraged exposure without rolling expiring contracts every month. Funding is the clever piece that makes that work, and it doubles as a useful signal. Persistently high positive funding usually means the long side is crowded. The cost is that funding, leverage, and liquidation rules combine into a product where the math is unforgiving and the venue's fine print matters as much as your view on price. If you want to go deeper, read your exchange's funding and liquidation documentation before anything else. Those pages describe the rules you would actually be trading under.
