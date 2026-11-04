---
date: '2026-11-04T02:14:37.000-08:00'
tags: ['finance', 'crypto', 'bitcoin', 'blockchain', 'utxo']
draft: false
title: "Your Bitcoin Wallet Has No Balance: UTXOs, Change, and Why Fees Ignore the Amount"
image: '/images/posts/your-bitcoin-wallet-has-no-balance-utxos-change-and-why-fees-ignore-the-amount.jpg'
topic: 'finance'
description: "Bitcoin doesn't track balances, it tracks unspent outputs. Here's how the UTXO model works, where change goes, and why sending $50 can cost more than sending $50,000."
---

Open almost any Bitcoin wallet and you'll see a single number at the top: your balance. It's a comforting fiction. The Bitcoin ledger has no concept of an account, and nothing on-chain says "this address holds 0.05 BTC." What actually exists is a pile of separate, indivisible chunks of bitcoin called **unspent transaction outputs**, or UTXOs. Your wallet adds them up and shows you the total.

That detail sounds academic until you notice something strange: two people sending the exact same amount can pay wildly different fees, and the size of the payment barely matters. Both facts fall straight out of the UTXO model.

## Coins are spent whole, and change is a new coin

Think of UTXOs like bills in a physical wallet. If you hold a single $50 bill and owe someone $10, you can't tear off a fifth of it. You hand over the whole bill and get $40 back.

A Bitcoin transaction works the same way. It lists **inputs** (existing UTXOs being consumed, each destroyed entirely) and **outputs** (brand new UTXOs being created). If you hold one 0.05 BTC UTXO and send 0.01 BTC, the transaction has one input and two outputs: 0.01 to the recipient and roughly 0.04 back to an address your wallet controls. That second output is called **change**.

There is also no "fee" field. The fee is implicit: whatever the inputs add up to, minus whatever the outputs add up to, goes to the miner.

```text
inputs:   0.05000000 BTC
outputs:  0.01000000 BTC  -> recipient
          0.03999297 BTC  -> your change address
fee:      0.00000703 BTC  (inputs - outputs, claimed by the miner)
```

This is why hand-built transactions are dangerous. Forget the change output and the entire 0.04 BTC difference becomes the fee. Wallets handle change automatically, which is also why your "balance" quietly hops to a fresh address after you spend.

## Fees are priced in bytes, not bitcoin

Block space is the scarce resource, so miners charge by size, measured in **virtual bytes** (vB), at a market rate quoted in satoshis per vB (sat/vB). The amount being moved is irrelevant. What matters is how many inputs and outputs the transaction carries.

For the common native SegWit (P2WPKH) address type, the widely used reference sizes are about 10.5 vB of fixed overhead, 68 vB per input, and 31 vB per output. That's enough to build a rough estimator:

```js
// Rough size for a P2WPKH transaction, in virtual bytes
const OVERHEAD = 10.5
const INPUT = 68
const OUTPUT = 31

function estimateFee({ inputs, outputs, satPerVb }) {
  const vbytes = OVERHEAD + inputs * INPUT + outputs * OUTPUT
  return { vbytes, sats: Math.ceil(vbytes * satPerVb) }
}

// Wallet A: one 0.05 BTC UTXO, sends 0.01 BTC (recipient + change)
estimateFee({ inputs: 1, outputs: 2, satPerVb: 5 })
// -> { vbytes: 140.5, sats: 703 }

// Wallet B: twenty-one 0.0005 BTC UTXOs, sends the same 0.01 BTC
estimateFee({ inputs: 21, outputs: 2, satPerVb: 5 })
// -> { vbytes: 1500.5, sats: 7503 }
```

Same payment, roughly ten times the fee, purely because Wallet B's money arrived in small pieces: think recurring purchases, mining payouts, or tips. Multiply the fee rate by ten during a congested mempool and Wallet B is paying around 75,000 sats for something Wallet A does for about 7,000.

It also explains **dust**. At 10 sat/vB, spending one P2WPKH input costs about 680 sats. A UTXO worth 500 sats is technically yours, but moving it costs more than it's worth. Node software enforces a separate, lower relay threshold (294 sats for P2WPKH outputs, 330 for Taproot, 546 for legacy), but economic dust shifts with fee rates.

## Coin selection: the wallet's quiet tradeoff

Every time you hit send, your wallet runs a **coin selection** algorithm to decide which UTXOs to spend. Bitcoin Core, for example, tries Branch-and-Bound first, which hunts for a combination that matches the target closely enough to skip a change output entirely (saving 31 vB now and an extra input later). If that fails it falls back to other strategies, and during high-fee periods it can switch to an algorithm that minimizes total weight.

The standard advice for a wallet full of small UTXOs is **consolidation**: when fees are low, send many small UTXOs to yourself in one transaction, leaving one large one. You pay for those inputs once, at a cheap rate, instead of repeatedly at whatever the market charges later.

The catch is privacy. Spending UTXOs together in one transaction publicly signals that they share an owner, which is exactly the heuristic chain-analysis firms rely on. Consolidating coins from a KYC'd exchange withdrawal with coins received elsewhere links those histories permanently.

Address type matters too. Taproot (P2TR) inputs are smaller (about 57.5 vB on a key-path spend) but its outputs are larger (43 vB), so it tends to come out ahead once a transaction has three or more inputs, and slightly behind for the simplest one-in, two-out payment.

## The takeaway

Once you stop picturing a balance and start picturing a drawer of coins, Bitcoin's behavior gets predictable: fees track how fragmented your coins are, change is just a new coin you send yourself, and every spend leaves a public trail of which coins traveled together. If you hold bitcoin long-term, it's worth opening your wallet's coin-control view once, seeing how many UTXOs you actually have, and checking a live fee estimator like mempool.space before deciding when, or whether, to tidy them up.
