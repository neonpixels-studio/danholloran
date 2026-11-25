---
date: "2026-11-25T02:15:16.000-08:00"
tags: ["finance", "crypto", "bitcoin", "blockchain", "on-chain-analytics"]
draft: false
title: "On-Chain Analytics: What the Ledger Can and Can't Tell You About Who Is Selling"
image: "/images/posts/on-chain-analytics-what-the-ledger-can-and-cant-tell-you-about-who-is-selling.jpg"
topic: "finance"
description: "Realized cap, MVRV, and exchange flows explained: how on-chain metrics are built, and why a label on an address is an inference, not a fact."
---

Every crypto downturn produces the same genre of chart: a big red arrow labeled "exchange inflows," a ratio dipping below some line, and a caption that says the whales are selling or the smart money is buying. It sounds like insider information. In a sense it is the opposite. Bitcoin's ledger is public, so anyone can watch coins move. What nobody can see directly is _who_ is moving them.

That gap is the whole story of on-chain analytics. The raw data is complete and verifiable. The metrics built on top of it depend on a layer of guesses about which addresses belong to which people, and those guesses are where most of the bad takes come from.

## Realized cap: pricing coins at the moment they last moved

The most useful idea in on-chain analysis is also the least intuitive. Market cap values every coin at today's price. **Realized cap** values each coin at the price it had the last time it moved on-chain. [Glassnode describes it](https://docs.glassnode.com/guides-and-tutorials/metric-guides/realized-capitalization) as the aggregate on-chain cost basis of the supply.

This works neatly on Bitcoin because of its UTXO model: every coin is a discrete chunk with a timestamp for when it was created. Here is a three-coin toy network:

```js
const utxos = [
  { btc: 1, priceWhenLastMoved: 20_000 },
  { btc: 1, priceWhenLastMoved: 60_000 },
  { btc: 1, priceWhenLastMoved: 100_000 },
];

const spot = 90_000;
const supply = utxos.reduce((sum, u) => sum + u.btc, 0);
const marketCap = supply * spot; // 270,000
const realizedCap = utxos.reduce(
  (sum, u) => sum + u.btc * u.priceWhenLastMoved,
  0,
); // 180,000

const realizedPrice = realizedCap / supply; // 60,000
const mvrv = marketCap / realizedCap; // 1.5
```

Two derived numbers fall out of this. **Realized price** is the average cost basis of the network, $60,000 here. **MVRV** (market value to realized value) is market cap divided by realized cap. Above 1.0, the average coin sits at a paper profit. Below 1.0, the average holder is underwater.

Now watch what happens when the $100,000 coin moves while spot is $90,000. It gets repriced to $90,000, so realized cap drops to $170,000 and realized price falls to about $56,667. Nobody needs to know who owned it. The metric simply records that coins bought high changed hands lower, which is what capitulation looks like in aggregate.

These numbers are live and they move. A [Glassnode research note dated November 24, 2026](https://research.glassnode.com/) put Bitcoin's realized price around $53,200 and observed that past bear markets traded below that level. That is a historical pattern, not a law, and the metric has blind spots: coins lost years ago still sit in realized cap at whatever price they last moved, quietly pulling the average down.

## Exchange flows: the metric that depends on a label

Realized cap needs no identity information. Exchange flows need nothing but. To say "10,000 BTC left exchanges today," an analytics firm first has to know which addresses belong to exchanges, and exchanges do not publish that list.

Glassnode's own [explainer on exchange metrics](https://research.glassnode.com/exchange-metrics/) is unusually candid about how this works. Labels come from three places:

- **Verified addresses**, confirmed by the exchange or by depositing funds and watching where they land.
- **External sources**, crowdsourced labels from around the web, which often conflict.
- **Clustering heuristics**, statistical rules that infer new addresses from a few known ones. The classic example is common-input ownership: if two addresses are spent together as inputs to one transaction, they probably share an owner.

Clustering is powerful. Glassnode says it can identify hundreds of thousands of addresses from a dozen seeds, and one exchange cluster it tracked had grown to nearly 25 million addresses. But the same post spells out the failure mode: a sudden 10,000 BTC "outflow" can turn out to be an exchange shuffling funds into a brand-new cold wallet that no heuristic has tagged yet. The flow gets reclassified hours later, and historical charts can quietly change.

Privacy tooling pushes in the other direction. [Elliptic notes](https://www.elliptic.co/wallet-clustering.html) that CoinJoin transactions are designed specifically to break the common-input assumption, and on account-based chains like Ethereum, shared smart contracts and aggregators can make unrelated users look like one wallet. Once coins cross a bridge, single-chain analysis loses the trail.

## Reading the charts without getting fooled

None of this makes on-chain data useless. It makes it a different kind of evidence than it is often presented as. A few habits help:

1. **Separate identity-free metrics from labeled ones.** Supply, fees, realized cap, and coin age come straight from the ledger. Exchange balances, "whale" wallets, and ETF or treasury holdings depend on someone's labels.
2. **Treat single large transactions as preliminary.** A one-day spike in inflows or outflows deserves a second look a day later, after the clustering has caught up.
3. **Prefer trends over thresholds.** Multi-week drift in exchange balances is more robust than any one data point, and an MVRV of 0.98 is not meaningfully different from 1.02.
4. **Check the methodology page.** Providers compute the same named metric differently. Glassnode notes that its MVRV market cap is built from on-chain balances, which can differ from the headline market cap you see elsewhere.

On-chain analytics is best read as a census with some respondents mislabeled: excellent at describing the population, shaky on any single individual. If you want to go further, the Glassnode [realized cap primer](https://research.glassnode.com/the-realized-cap-foundation/) and the academic paper [Resurrecting Address Clustering in Bitcoin](https://arxiv.org/abs/2107.05749) are good next reads, the first for the metrics and the second for how shaky the ground truth under clustering really is.
