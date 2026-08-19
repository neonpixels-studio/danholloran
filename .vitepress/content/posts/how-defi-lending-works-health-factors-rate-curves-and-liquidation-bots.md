---
date: "2026-08-19T02:08:11.000-05:00"
tags: ["finance", "crypto", "defi", "ethereum", "defi-lending"]
draft: false
title: "How DeFi Lending Works: Health Factors, Rate Curves, and Liquidation Bots"
image: "/images/posts/how-defi-lending-works-health-factors-rate-curves-and-liquidation-bots.jpg"
topic: "finance"
description: "On-chain lending replaces credit checks with collateral, loan officers with a utilization curve, and collections with bots. Here is what each of those swaps actually costs you."
---

A bank loan gets underwritten. Someone pulls your credit, looks at your income, and makes a judgment call about whether you will pay it back. An on-chain lending protocol does none of that. It does not know who you are, it cannot sue you, and it will never call you. So it replaces the three things a bank relies on with mechanical substitutes: collateral instead of trust, a formula instead of a loan officer, and bots instead of a collections department.

Everything that feels strange about DeFi lending falls out of those three swaps. Once you see them, the rest of it stops being mysterious and starts being arithmetic.

## Collateral does all the work trust used to do

Because a protocol cannot chase you, it never lends you more than you have already handed it. You deposit $150 of ETH, you borrow $100 of USDC, and the extra $50 is the protocol's entire defense against your default. That is overcollateralization, and typical loan-to-value ceilings land somewhere in the 66 to 80 percent range depending on the asset.

Two parameters matter, and people conflate them constantly. The **LTV** is the most you can borrow at the moment you open the position. The **liquidation threshold** is the point at which the protocol stops tolerating you. On a market where ETH has an 80 percent LTV and an 82.5 percent liquidation threshold, the gap between the two is your entire cushion. Deposit $10,000 of ETH, borrow the full $8,000, and ETH only has to fall about three percent before you are eligible to be liquidated. Borrow $4,000 instead and ETH can roughly halve first.

Aave expresses this as a single number, the **health factor**: the sum of your collateral weighted by each asset's liquidation threshold, divided by your total debt. Above 1.0 you are fine. At 1.0 you are not. Nothing in between is a warning; the protocol has no concept of a courtesy call.

## The interest rate is a curve, not a committee

Nobody sets the borrow rate. It is a function of **utilization**, the share of a pool's supplied assets that are currently borrowed out.

Most protocols use a two-slope kinked curve. Below a target utilization, the rate rises gently as borrowing increases. Above it, the slope turns sharp, sometimes brutally so. The kink is not decoration; it is a liquidity defense. If suppliers could never withdraw because the pool were fully lent out, the whole thing would break, so the curve makes the last slice of liquidity expensive enough that borrowers repay and new suppliers show up.

The design tradeoff is visible if you compare approaches. Aave V3 sets the optimal usage ratio, both slopes, the base rate, and the reserve factor per asset through governance, which is conservative and leaves a chunk of capital idle. Newer isolated-market designs like Morpho's adaptive rate model instead push utilization toward a target near 90 percent, which passes more of what borrowers pay through to suppliers, at the cost of a thinner withdrawal buffer. Higher advertised supply yields on the same asset usually mean exactly this: someone moved the dial toward efficiency and away from slack.

## Liquidation is an auction you did not agree to attend

When your health factor crosses below 1.0, your position becomes a public opportunity. Anyone running a keeper bot can repay part of your debt and seize your collateral at a discount, and that discount is paid by you.

The mechanics on Aave V3 are worth knowing precisely. The standard close factor is 50 percent, meaning a liquidator can retire up to half your debt in one call; if your health factor drops below about 0.95, the protocol permits a full 100 percent close. The liquidation bonus is set per asset, roughly 5 percent on stablecoins and ETH and closer to 10 percent on more volatile collateral like WBTC. So a $20,000 debt liquidated at the standard close factor with a 5 percent bonus costs you $500 in seized collateral on top of the debt repayment, and you are still holding the remainder of the position.

The part people underestimate is that liquidation depends on an oracle, not on reality. Prices come from feeds such as Chainlink, and when a feed goes stale or an L2 sequencer stalls, the number the protocol acts on is not the number on your screen. Aave added a price oracle sentinel specifically for this, granting a grace period after sequencer downtime so borrowers can restore positions before bots swarm. It helps. It is not a guarantee.

## The practical read

A DeFi loan is not a loan that sits there. It is a running position with a live margin requirement, priced by a curve you do not control and policed by bots that are paid to act the instant you slip. Risk stewards flagged wallets running leveraged stablecoin loops at health factors near 1.03 earlier this year, which is a way of saying some people are treating a three percent buffer as a strategy.

If you want to understand a specific market, read its parameters directly: LTV, liquidation threshold, close factor, liquidation bonus, reserve factor, and the shape of its rate curve. They are all public, all on-chain, and they tell you far more than any advertised APY does.
