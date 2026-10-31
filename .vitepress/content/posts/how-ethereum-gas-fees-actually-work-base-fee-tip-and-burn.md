---
date: "2026-10-31T02:15:19.000-07:00"
tags: ["finance", "crypto", "ethereum", "blockchain", "gas-fees"]
draft: false
title: "How Ethereum Gas Fees Actually Work: Base Fee, Tip, and Burn"
image: "/images/posts/how-ethereum-gas-fees-actually-work-base-fee-tip-and-burn.jpg"
topic: "finance"
description: "Your wallet shows one number, but an Ethereum fee is really three: a protocol-set base fee that gets burned, a tip for the validator, and a ceiling you mostly get refunded."
---

Open a wallet, hit send, and you get a single line: "Network fee: $0.04." It looks like a price tag. It is closer to a bid in a tiny auction that reruns every twelve seconds, with one part of the price set by the protocol, one part set by you, and a safety ceiling that you will usually not pay at all.

Most confusion about Ethereum fees comes from treating that number as one thing. Since the London upgrade in 2021 (EIP-1559), it has been three things, and knowing which is which explains why fees spike, why some ETH disappears with every block, and why overpaying is harder than it looks.

## Gas is the unit, gwei is the price

Every operation the Ethereum Virtual Machine runs has a fixed cost in **gas**. A plain ETH transfer costs 21,000 gas. A token swap might cost 120,000 or more, because it reads and writes far more state. Gas measures work, not money.

The price of each unit of gas is quoted in **gwei**, which is one billionth of an ETH. So your fee is always:

```
fee = gas used × price per gas
```

The interesting part is how that price per gas gets set. Under EIP-1559 it has two components.

- **Base fee:** set by the protocol, identical for every transaction in a block, and **burned**. It leaves the supply permanently instead of going to anyone.
- **Priority fee (tip):** set by you, paid to the validator who includes your transaction. It is how you ask to jump ahead when blocks are busy.

You also set a **max fee**, the most you are willing to pay per gas in total. You pay `min(max fee, base fee + tip)`, and the gap between your max fee and what you actually paid comes back to you.

## How the base fee moves

The base fee is not a market guess. It is a formula that reacts to how full the last block was.

Each block has a gas limit (on mainnet that is 60 million gas, after validators raised it from 30 million during 2025) and a target of half that, 30 million. If a block uses more than the target, the next block's base fee goes up. If it uses less, the base fee goes down. The maximum move per block is 12.5%.

That one rule produces most of the fee behavior people notice. Suppose the base fee is 1 gwei and demand surges so that blocks are completely full:

| Block | Base fee (gwei) |
| ----- | --------------- |
| n     | 1.00            |
| n+1   | 1.13            |
| n+2   | 1.27            |
| n+5   | 1.80            |
| n+10  | 3.25            |

Ten full blocks, about two minutes, more than triples the price. Then the moment demand eases, it walks back down the same way. That is why fees feel spiky: the formula compounds quickly in both directions, by design, to push demand toward the 50% target.

## A worked example

Say you send ETH to a friend. Your wallet reads the current base fee as 0.50 gwei and suggests a 0.05 gwei tip. To protect you from the base fee rising before your transaction lands, it sets the max fee at roughly double the base fee plus the tip: 1.05 gwei.

Your transaction lands in the next block, where the base fee has ticked up to 0.52 gwei.

```
price paid per gas = min(1.05, 0.52 + 0.05) = 0.57 gwei
total fee          = 21,000 × 0.57 gwei = 11,970 gwei ≈ 0.000012 ETH
burned             = 21,000 × 0.52 gwei = 10,920 gwei
to the validator   = 21,000 × 0.05 gwei =  1,050 gwei
never charged      = 21,000 × (1.05 − 0.57) gwei = 10,080 gwei
```

Two things stand out. First, the generous max fee did not cost you anything; it only capped your exposure. Second, the large majority of what you paid was burned. When network activity is high enough, the burn can exceed the new ETH issued to validators, which is the mechanism behind the "ultrasound money" argument. When activity is low, as it has been for much of the period since rollups absorbed most retail traffic, issuance wins and supply grows. The burn is real, but whether it makes ETH deflationary depends entirely on usage, and that is not something the protocol guarantees.

## Blobs, rollups, and what is coming

Since the Dencun upgrade in 2024, layer-2 rollups post their data in **blobs**, which have their own separate fee market with its own base fee, using the same up-and-down logic. Blob capacity has been raised in steps; a parameter-only fork in January 2026 lifted the target to 14 blobs per block and the maximum to 21. That separate market is why a swap on a rollup can cost a fraction of a cent even when mainnet is busy.

Mainnet capacity is next. The Glamsterdam upgrade, which bundles enshrined proposer-builder separation and block-level access lists, went live on the Sepolia testnet on October 6 and is scheduled for Hoodi on October 26, where the testnet gas limit rises to 200 million. As of the Ethereum Foundation's October 16 announcement, a mainnet date had not been set. A higher gas limit raises the target, which tends to lower base fees at a given level of demand, but demand is the variable nobody controls. Cheaper blockspace has historically attracted more usage rather than simply making the same usage cheaper.

The practical takeaway: when you see a fee, read it as base fee plus tip, capped by a max you mostly get back. If a transaction is not urgent and the base fee is spiking, waiting a few minutes often works, because the same formula that drove it up will drive it down. For the source of truth, read [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) itself and the [Ethereum Foundation blog](https://blog.ethereum.org/) for upgrade timing.
