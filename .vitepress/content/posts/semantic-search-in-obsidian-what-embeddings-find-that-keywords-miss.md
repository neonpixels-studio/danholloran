---
date: "2026-09-08T02:07:14.000-07:00"
tags:
  ["obsidian", "pkm", "plugins", "knowledge-management", "community-plugins"]
draft: false
title: "Semantic Search in Obsidian: What Embeddings Find That Keywords Miss"
image: "/images/posts/semantic-search-in-obsidian-what-embeddings-find-that-keywords-miss.jpg"
topic: "obsidian"
description: "Obsidian's search operators are precise, but they only find notes when you remember the words you used. Here's what local embedding plugins add, where they quietly fail, and why hybrid ranking is the honest answer."
---

You know the note exists. You wrote it maybe eight months ago, something about why a project stalled, and now you want it back. You open search, type `stalled`, get nothing. Try `blocked`. Nothing. Try `postmortem`. Two hits, both irrelevant. The note is sitting right there in the vault, and the only thing standing between you and it is that past-you called it "the thing where we kept waiting on legal."

This is the failure mode Obsidian's search is structurally incapable of fixing, and it has nothing to do with the search being bad.

## Keyword search is a vocabulary contract

Obsidian's core search is genuinely good. The operators are precise and composable, and most people never learn half of them:

```
path:"Projects/" tag:#retro -tag:#archive line:(deadline OR slipped)
```

That query is doing real work: scope to a folder, require one tag, exclude another, and match two terms that appear on the same line. No plugin needed. If you know the shape of what you're looking for, this beats anything fancier.

But every one of those terms is a literal. Lexical search ranks documents by how well the query's tokens overlap the document's tokens, with weighting for how rare each token is across the vault. It is a contract: you agree to search using the same words you wrote with. When you honor that contract, the results are fast and exact. When you break it, you get zero results and no hint that you were close.

The awkward part is that you break it constantly. Your vocabulary drifts across years. You paraphrase when you search, and quote when you write. Partial recall is the normal case, not the edge case.

## What an embedding index actually stores

Semantic search plugins replace the token-overlap contract with a proximity one. Your notes get chunked and passed through an embedding model, which turns each chunk into a vector, a list of a few hundred numbers positioned so that text with similar meaning lands nearby. At query time your search phrase gets embedded the same way, and the plugin returns the chunks closest to it.

[Smart Connections](https://github.com/brianpetro/obsidian-smart-connections) is the most established version of this in the community plugin browser. Two implementation details matter more than the marketing:

**It runs locally by default.** It ships with a built-in embedding model, needs no API key, and writes vectors into a `.smart-env/` directory inside your vault. Nothing leaves the machine unless you deliberately point it at a hosted model. If you sync your vault, add that directory to your ignore list rather than shipping a few hundred megabytes of derived data between devices.

**It embeds blocks, not files.** Chunking happens at the paragraph, list-item, and heading level, so a 4,000-word note contributes dozens of separately searchable units. This is why the Connections sidebar can surface a single relevant paragraph out of a long meeting note instead of just telling you the note is "related." File-level embedding averages a note's meaning into mush; block-level embedding is what makes the feature useful.

For the stalled-project example, this works. "Why did this project stall" and "we kept waiting on legal" live near each other in vector space even though they share no words at all.

## Proximity is not meaning

Here is the part the plugin listings skip: closeness in vector space is a proxy for relatedness, not a definition of it. Two paragraphs that read similarly score high whether or not they are logically connected. Two that are causally linked score low if they are written in different registers, which is exactly what happens when a bullet-point meeting note and a polished essay describe the same decision.

So embeddings fail in the mirror-image way keywords do. Keyword search misses paraphrase. Vector search hallucinates relevance from surface style. Neither is a superset of the other.

Newer plugins have started treating that as the design premise rather than a bug. [VaultSearch](https://community.obsidian.md/plugins/vault-search) runs BM25 keyword matching, on-device vector similarity, and fuzzy title matching as three separate rankers, then merges them with reciprocal rank fusion. RRF is unglamorous and effective: instead of trying to normalize incompatible scores, it scores each result purely by its position in each list.

```js
// k=60 is the conventional constant; it damps the top of each list
const rrf = (rankLists, k = 60) => {
  const scores = new Map();
  for (const list of rankLists) {
    list.forEach((id, i) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1));
    });
  }
  return [...scores].sort((a, b) => b[1] - a[1]);
};
```

A note that lands third in the keyword list and fifth in the vector list outranks one that took first in either alone. Agreement across methods is the signal.

## Where this leaves you

Don't install a semantic search plugin to replace core search. Learn the operators first, because for anything you can name precisely, they are faster and they never guess. Add embeddings for the other case: the note you can describe but not quote.

Two things to check first. Initial indexing on a large vault costs minutes and a fair amount of CPU, so kick it off when you aren't trying to work. And watch your plugin count: past roughly twenty active plugins, startup lag and note-switching latency get noticeable, especially on mobile. A semantic index is worth a slot. It is not worth three.
