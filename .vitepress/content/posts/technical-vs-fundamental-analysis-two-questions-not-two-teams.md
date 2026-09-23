---
date: "2026-09-23T02:15:15.000-07:00"
tags:
  [
    "finance",
    "investing",
    "stocks",
    "markets",
    "technical-vs-fundamental-analysis",
  ]
draft: false
title: "Technical vs. Fundamental Analysis: Two Questions, Not Two Teams"
image: "/images/posts/technical-vs-fundamental-analysis-two-questions-not-two-teams.jpg"
topic: "finance"
description: "Fundamental analysis asks what a business is worth. Technical analysis asks what the price is doing. Here's how each one works, what the research says, and why the rivalry is mostly a category error."
---

Spend ten minutes in any investing forum and you will find two camps talking past each other. One side posts discounted cash flow spreadsheets and quotes Benjamin Graham. The other posts candlestick charts covered in trendlines and argues that "price is the only truth." Each side tends to treat the other as astrology.

The framing is the problem. Fundamental and technical analysis are not competing answers to the same question. They are answers to two different questions, and most confusion comes from using one to answer the other's.

## Fundamental analysis: what is this worth?

Fundamental analysis tries to estimate a business's intrinsic value from its economics: revenue, margins, cash flow, debt, competitive position, and how all of that is likely to change. The formal version goes back to Graham and Dodd's _Security Analysis_ in 1934, and the core idea has not changed. A share is a claim on future cash flows, so its value is those cash flows discounted back to today.

The simplest shortcut is a multiple. Say a company earns $5.00 per share and trades at $100. That is a price-to-earnings ratio of 20. Whether 20 is cheap depends entirely on what you expect next:

- If earnings grow 15% a year for five years, earnings per share reach about $10.06. At the same $100 price, you would be paying roughly 10x those future earnings.
- If earnings stay flat, you are still paying 20x, and every dollar of return has to come from the market deciding to pay a higher multiple.

Same price, same current earnings, wildly different conclusions. That is the real work of fundamental analysis: not computing the ratio, but defending the growth, margin, and risk assumptions that make the ratio meaningful.

Its weakness is timing. A valuation model can tell you a stock looks underpriced relative to your assumptions. It says nothing about whether the gap closes in three weeks or never. Markets can ignore a "correct" valuation for a long time, and your assumptions might be the thing that is wrong.

## Technical analysis: what is the price doing?

Technical analysis ignores the income statement and studies market data directly: price, volume, and the patterns they form. The premise is that prices reflect the collective behavior of buyers and sellers, and that behavior (herding, anchoring, slow reaction to news) leaves traces that repeat.

A classic example is the moving average crossover. Here is a minimal version in JavaScript that flags when a short-term average crosses a long-term one:

```js
function sma(prices, window) {
  return prices.map((_, i) =>
    i < window - 1
      ? null
      : prices.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0) / window,
  );
}

function crossovers(closes, short = 50, long = 200) {
  const fast = sma(closes, short);
  const slow = sma(closes, long);
  const signals = [];

  for (let i = 1; i < closes.length; i++) {
    if ([fast[i], slow[i], fast[i - 1], slow[i - 1]].includes(null)) continue;
    if (fast[i - 1] <= slow[i - 1] && fast[i] > slow[i])
      signals.push({ i, type: "golden-cross" });
    if (fast[i - 1] >= slow[i - 1] && fast[i] < slow[i])
      signals.push({ i, type: "death-cross" });
  }
  return signals;
}
```

Notice what this code does not know: anything about the company. It is purely a statement about trend. That is both the appeal and the risk. It is easy to backtest, easy to automate, and easy to overfit. Try enough window lengths on enough tickers and something will look brilliant on historical data by pure chance.

Its weakness mirrors fundamental analysis's. Technical signals can say something about momentum and timing, but they say nothing about value. A chart can look strong right up until an earnings miss erases a year of gains overnight.

## What the evidence actually says

Neither camp gets a clean win, which is probably why the argument never ends.

On the technical side, the most durable finding is not chart patterns but momentum. Jegadeesh and Titman's 1993 study found that U.S. stocks that had outperformed over the prior three to twelve months tended to keep outperforming over the following months, and the effect has been replicated across many markets since. Lo, Mamaysky, and Wang's 2000 paper in the _Journal of Finance_ used an automated pattern recognition approach on U.S. stocks from 1962 to 1996 and found that some classic patterns carried modest incremental information. "Modest" is the operative word: small edges tend to shrink once trading costs and taxes come out, and many simple rules that worked historically faded after they were published.

On the fundamental side, the question is less "does valuation matter" (it clearly does over long horizons) and more "can professionals exploit it after fees." S&P Dow Jones Indices' SPIVA scorecard is the standard reference here, and the latest mid-year 2026 report found that 67% of active large-cap U.S. equity funds underperformed the S&P 500 in the first half of the year. That was actually an improvement on the 79% underperformance rate for full-year 2025. These are funds staffed by people doing fundamental analysis full time.

The honest read: both methods can contain real information, and both are extremely hard to turn into consistent excess returns after costs. The market is not perfectly efficient, but it is competitive enough that obvious edges do not stay obvious.

## Using both without fooling yourself

The useful move is to stop treating these as identities and start treating them as tools. Fundamental analysis is a framework for understanding what you own and what would have to be true for its price to make sense. Technical analysis is a framework for describing how the market is currently behaving toward it. A practitioner might use the first to decide what is worth owning at all, and the second to think about entry, exit, and position risk.

Whichever lens you pick up, the same discipline applies: write down your assumptions before you look at the result, test on data you did not tune on, and account for costs. If you want to go deeper, read the SPIVA methodology notes and the original Jegadeesh and Titman paper. Both are more readable than their reputations suggest, and both are a good antidote to anyone selling certainty.
