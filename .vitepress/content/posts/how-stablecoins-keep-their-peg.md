---
date: "2026-06-20T23:24:14.000+00:00"
tags: ["finance", "crypto", "stablecoins", "blockchain", "web3"]
draft: false
title: "How Stablecoins Keep Their Peg — And Why It's Harder Than It Looks"
image: "/images/posts/how-stablecoins-keep-their-peg.jpg"
topic: "finance"
description: "Stablecoins promise $1 forever, but the mechanics behind that stability vary wildly. Here's how fiat-backed, crypto-backed, and algorithmic designs each approach the peg — and what can go wrong."
---

Crypto is famous for volatility — Bitcoin can swing 20% in a week, and altcoins can do that in a day. Stablecoins exist to solve this problem: they're cryptocurrencies designed to maintain a fixed value, almost always pegged to the US dollar. The stablecoin market has grown to well over $200 billion in circulation, and these tokens have become the backbone of most on-chain activity — from lending protocols to cross-border transfers.

But "stable" is doing a lot of work in that sentence. How a stablecoin holds its peg varies enormously depending on its design, and the tradeoffs matter. There are three main approaches: fiat-backed, crypto-backed, and algorithmic.

## Fiat-Backed: The Simple Idea

The most widely-held stablecoins — USDC (issued by Circle) and USDT (Tether) — are backed by reserves held off-chain. The model is straightforward in theory: for every token in circulation, the issuer holds $1 in cash or cash-equivalent assets like short-term Treasury bills.

The peg is enforced through arbitrage. If USDC trades at $0.99 on an exchange, large traders can buy it at a discount and redeem it directly with Circle for exactly $1, pocketing the difference. That buying pressure pushes the price back toward $1. The reverse applies too: if USDC trades at $1.01, traders can mint new USDC for $1 and sell it at the premium.

The risk here is less mathematical than it is counterparty and reserve quality. Tether's reserves were famously opaque for years — the actual composition (cash versus commercial paper versus other assets) was a long-running source of scrutiny. Circle publishes monthly attestations of USDC's reserves, held primarily in short-term US Treasuries and cash. Still, USDC briefly depegged in March 2023 when it revealed that roughly $3.3 billion of its reserves were held at Silicon Valley Bank during its collapse — a reminder that "backed by dollars" is only as reliable as the institution holding those dollars.

## Crypto-Backed: Decentralized but Over-Collateralized

DAI (now rebranded USDS after MakerDAO became Sky Protocol) takes a different approach: instead of dollars in a bank, it's backed by crypto assets locked in smart contracts on-chain. Because crypto itself is volatile, the system requires over-collateralization — you have to lock up more value than you want to borrow.

To generate $1,000 in USDS, for example, you might need to lock $1,500 worth of ETH. If ETH's price falls and your collateral ratio drops below a minimum threshold, your position gets liquidated automatically — the smart contract sells enough of your ETH to repay the debt and close the position.

The peg is maintained through a mix of the liquidation mechanism, a Dai Savings Rate (a yield paid to holders that increases demand for the token), and ongoing governance decisions made by MKR/SKY token holders. There's no central issuer, which is the appeal — but that also introduces governance risk. A bad parameter vote or a protocol exploit can destabilize the system. In extreme market conditions, like March 2020's sharp crypto crash, rapid ETH price drops outpaced the liquidation mechanism and left some positions briefly undercollateralized.

## Algorithmic: The Hard Lesson

The third approach dispenses with external backing entirely. TerraUSD (UST) was the most prominent example — a stablecoin backed by a sibling token (LUNA) through a mint-and-burn mechanism. To mint 1 UST, you burned $1 worth of LUNA. To redeem 1 UST, you received $1 of newly minted LUNA in return. As long as confidence in the system held, the arbitrage loop maintained the peg.

In May 2022, it didn't hold. Large sell pressure pushed UST slightly below $1. Arbitrageurs redeemed UST for LUNA, which increased LUNA's circulating supply. A larger supply drove LUNA's price down, which meant you needed even more LUNA to satisfy a $1 redemption, which increased supply further. The death spiral erased roughly $40 billion in value within days.

The lesson is stark: a stablecoin backed only by another volatile asset in a circular dependency is not really stable at all. It's a market confidence mechanism that can unwind as fast as confidence disappears.

## What This Means Practically

Regulators have taken note. The EU's MiCA framework, in full effect since 2024, effectively mandates the fiat-backed model for any regulated stablecoin issuer — requiring audited liquid reserves and licensing. US stablecoin legislation has been moving in a similar direction, focusing on reserve requirements and oversight for issuers.

The practical takeaway for anyone using stablecoins: they are not interchangeable. USDC and USDT carry issuer and reserve risk. USDS carries collateral and governance risk. The "algorithmic only" model has a cautionary track record. Understanding which type you're holding — and what backs it — is the starting point for understanding what you're actually exposed to.
