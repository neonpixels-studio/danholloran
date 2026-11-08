---
date: "2026-11-07T16:26:25.000-08:00"
tags: ["finance", "crypto", "blockchain", "proof-of-reserves"]
draft: false
title: "Proof of Reserves: What an Exchange's Merkle Tree Can and Can't Prove"
image: "/images/posts/proof-of-reserves-what-an-exchanges-merkle-tree-can-and-cant-prove.jpg"
topic: "finance"
description: "Exchanges publish proof of reserves to show customer funds are backed. Here's how the Merkle sum tree behind it works, and the liabilities it was never designed to see."
---

When FTX collapsed in November 2022, customers learned the hard way that a balance on an exchange screen is a promise, not a possession. Within weeks, nearly every large exchange started publishing "proof of reserves" reports, and many of them now link one from their homepage with a green checkmark next to it.

That checkmark is doing a lot of work. Proof of reserves is a clever piece of cryptography, and it does answer a real question. It just answers a narrower question than most people think it does. Understanding the mechanism is the fastest way to see where the gaps are.

## The question it is trying to answer

An exchange is solvent if what it holds is at least what it owes:

```text
assets (reserves)  >=  liabilities (what customers are owed)
```

Proving the left side is the easier half. Crypto reserves sit at on-chain addresses, so an exchange can show which addresses it controls, usually by signing a message with each address's key, and anyone can read the balances from the blockchain.

The right side is the hard half. Liabilities live in the exchange's private database. Publishing every customer's balance would be a privacy disaster, so exchanges need a way to commit to a total without revealing the parts, while still letting each customer check that they were counted. That is the job of a Merkle sum tree.

## How a Merkle sum tree works

A regular Merkle tree hashes data in pairs, then hashes those hashes, and so on until there is a single root hash. Change any input and the root changes. A Merkle sum tree, proposed for exchanges by Bitcoin developer Greg Maxwell, adds one thing: every node also carries the sum of the balances below it.

Here is a toy tree with four customers:

```text
                    root: sum 10.0
                 /                    \
        node A: sum 3.5            node B: sum 6.5
         /           \              /            \
   alice 1.5     bob 2.0      carol 6.0       dave 0.5
```

The exchange publishes only the root hash and the root sum, 10.0 BTC. It then gives each customer a private proof: their own leaf, plus the sibling hash and sum at each level on the way up. Alice gets bob's leaf and node B. With those, she can recompute the root herself:

```js
import { createHash } from "node:crypto";

const h = (...parts) =>
  createHash("sha256").update(parts.join("|")).digest("hex");

// Leaf hash commits to a private account ID and the balance
const leaf = (id, bal) => ({ hash: h("leaf", id, bal), sum: bal });
const parent = (l, r) => ({
  hash: h(l.hash, l.sum, r.hash, r.sum),
  sum: l.sum + r.sum,
});

// Published by the exchange alongside the 10.0 BTC total
const PUBLISHED_ROOT_HASH = "<root hash from the exchange>";

// Alice's proof: her leaf plus the sibling at each level
const alice = leaf("acct-7f3a", 1.5);
const proof = [
  { side: "right", node: { hash: "<bob leaf hash>", sum: 2.0 } },
  { side: "right", node: { hash: "<node B hash>", sum: 6.5 } },
];

let node = alice;
for (const { side, node: sib } of proof) {
  if (sib.sum < 0) throw new Error("negative balance in proof");
  node = side === "right" ? parent(node, sib) : parent(sib, node);
}
console.log(node.hash === PUBLISHED_ROOT_HASH, node.sum === 10.0);
```

If the hash matches the published root, Alice knows her 1.5 BTC was included in the 10.0 BTC total, and she learned nothing about any individual except that some sibling subtrees sum to 2.0 and 6.5. The negative-balance check matters: without it, an exchange could hide a fake account with a balance of -5.0 to shrink the total. Newer systems go further and wrap the whole tree in a zero-knowledge proof (Binance added zk-SNARKs in early 2023; OKX uses zk-STARKs) so the exchange can prove that every leaf is non-negative without anyone seeing the leaves.

## What the green checkmark does not tell you

Even a perfectly built proof has hard limits, and they are the reason accounting regulators pushed back.

- **It only counts liabilities the exchange chose to put in the tree.** Loans the exchange took out, money owed to other firms, and pending legal claims are not customer balances, so they never appear. An exchange can show every customer fully backed while owing a lender more than it holds.
- **It is a snapshot.** Assets can be borrowed for the day of the snapshot and returned the next morning. The proof says nothing about yesterday or tomorrow.
- **Only customers who check are protected.** If an exchange leaves out accounts that rarely log in, the only people who could notice are the ones least likely to look. The system's security depends on many users actually running the verification.
- **Holding a key is not owning the coins.** Signing with an address proves control, not that those coins are not already pledged elsewhere.

In March 2023, the US Public Company Accounting Oversight Board warned investors that proof-of-reserve reports are point-in-time snapshots that do not follow PCAOB auditing standards. Around the same time, accounting firm Mazars stopped working with crypto clients after one of its limited reviews was promoted as an audit. A proof of reserves is an attestation about a narrow set of facts, not a financial audit.

## The takeaway

Proof of reserves is real progress: before 2022, most exchanges offered nothing but trust. If you hold funds on an exchange that publishes one, actually verify your own leaf, since the system only works when users check. Just read the result for what it is: evidence that customer balances were counted and that matching assets existed at one moment, not proof that the business is solvent. For deeper reading, Vitalik Buterin's 2022 essay "Having a safe CEX: proof of solvency and beyond" walks through both the cryptography and its blind spots.
