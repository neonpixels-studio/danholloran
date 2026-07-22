---
date: "2026-07-22T02:08:47.000-05:00"
tags: ["finance", "crypto", "ethereum", "staking"]
draft: false
title: "How Staking Actually Works: Validators, Rewards, and Slashing"
image: "/images/posts/how-staking-works-validators-rewards-and-slashing-in-proof-of-stake.jpg"
topic: "finance"
description: "A plain-English look at what happens under the hood when you stake crypto: how validators secure a proof-of-stake network, where the yield comes from, and what slashing really risks."
---

"Earn 4% on your ETH" sounds a lot like a savings account, and that framing is exactly why staking is so easy to misunderstand. There's no bank paying you interest out of its lending margin. When you stake, you're posting collateral to do a job for a blockchain, and the network is paying you for the work while holding your deposit hostage against you doing it badly. The yield is real, but it comes from a specific place, and so does the risk. Both are worth understanding before the number on the dashboard becomes the only thing you look at.

## What a validator actually does

Proof-of-stake replaced the energy-hungry mining of proof-of-work with a simpler idea: instead of burning electricity to earn the right to add blocks, you lock up capital. On Ethereum, one validator requires 32 ETH. That deposit activates a piece of software that does two repetitive jobs. It _proposes_ new blocks when the protocol randomly selects it, and far more often it _attests_ to blocks other validators have proposed, essentially voting "yes, this looks valid." Thousands of these attestations per slot are how the network reaches agreement without a central referee.

The 32 ETH isn't a fee. It's a bond. The whole security model rests on the idea that a validator has something real to lose, so honest behavior is cheaper than cheating. As of mid-2026, more than 39 million ETH is staked across roughly 1.2 million validators, and the network added over 96,000 new validators in the first half of the year alone. That's a lot of capital voluntarily locked up to keep the chain honest.

## Where the yield comes from

The reward isn't one thing. It's three, stacked. First is the protocol issuance: Ethereum mints new ETH to pay validators for proposing and attesting, which forms the base layer of the yield, currently in the neighborhood of 2.8 to 3 percent. Second is transaction tips, the priority fees users attach to get their transactions included. Third is MEV (maximal extractable value), the extra ETH a proposer can capture by ordering transactions in a block intelligently. Add them up and solo stakers typically see something like 3 to 5 percent APY, with the exact figure swinging on network activity and plain luck in how often you're chosen to propose.

It helps to notice what _isn't_ funding this. EIP-1559 burns a chunk of every transaction's base fee, permanently removing it from supply. So the network is issuing new ETH to validators with one hand and destroying ETH with the other. When activity is high, the burn can outpace issuance, which is why "yield" and "supply inflation" are not the same conversation.

## Slashing, and the four ways to stake

The counterweight to the reward is slashing. If a validator does something that could attack the chain, the protocol automatically confiscates part of its stake and ejects it. There are really only a few slashable offenses, and they all amount to lying about history: proposing two different blocks for the same slot, or making contradictory attestations that would let you rewrite what already happened. Simply going offline is _not_ slashing; it earns small "inactivity" penalties that leak your balance slowly, nothing like the guillotine. And slashing is genuinely rare. Fewer than 500 validators out of over a million have ever been slashed, well under 0.04% of the network, and most of those were operator mistakes rather than attacks.

Most people never touch 32 ETH or run a node, so staking has grown four broad on-ramps. _Solo staking_ means running your own validator: maximum control, maximum responsibility, and you eat any slashing yourself. _Pooled staking_ lets you contribute smaller amounts to a shared validator. _Liquid staking_ through protocols like Lido or Rocket Pool takes your ETH and hands back a receipt token (stETH, rETH) that keeps earning while staying usable elsewhere in DeFi. And _restaking_, dominated by EigenLayer, lets already-staked ETH be pledged again as security for other services in exchange for extra yield, roughly 0.3 to 1.5% more as of 2026. Each step down that list trades away a little self-custody or adds a layer of smart-contract risk in exchange for convenience or a few extra basis points.

## The takeaway

Staking is worth understanding as a mechanism, not just a rate. The yield is the network paying you to be a reliable, honest participant, and the collateral is what makes your honesty credible. When you stake through a service, you're mostly delegating that job and inheriting a new set of risks, from smart-contract bugs to the concentration of power in a few large operators. None of that makes staking bad. It just means the interesting question isn't "what's the APY," it's "what am I actually agreeing to secure, and with whom." If you want to go deeper, Ethereum's own docs on rewards and penalties are the clearest primary source, and they're free of anyone trying to sell you a token.
