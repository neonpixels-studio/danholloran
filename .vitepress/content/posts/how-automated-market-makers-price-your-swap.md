---
date: "2026-07-11T02:07:50.000-05:00"
tags: ["finance", "crypto", "defi", "web3", "automated-market-makers"]
draft: false
title: "How Automated Market Makers Price Your Swap"
image: "/images/posts/how-automated-market-makers-price-your-swap.jpg"
topic: "finance"
description: "There is no order book behind a decentralized exchange swap. There is a formula. Here is the math that sets the price, and why liquidity providers can lose money while doing everything right."
---

The first time you swap tokens on a decentralized exchange, the thing that should surprise you is that nobody is on the other side of the trade. There is no buyer matching your sell, no market maker quoting a spread, no order book at all. You send tokens into a contract, the contract sends different tokens back, and the price you got was decided by arithmetic that fits on one line.

That arithmetic is the automated market maker, and understanding it is the difference between "DeFi is magic" and actually knowing what happened to your money. It also explains the least intuitive fact in the whole space: a liquidity provider can watch their asset double in price and still end up with less than if they had just held it.

## The formula is x times y equals k

A liquidity pool holds reserves of two tokens. Call them `x` and `y`. The pool's rule is that the product of the reserves must never fall after a trade:

```
x * y = k
```

That is the entire pricing engine of a constant product market maker, the design [Uniswap](https://developers.uniswap.org/docs/get-started/concepts/how-uniswap-works) popularized and most AMMs still build on. When you put `dx` tokens in, the contract hands you the amount of `y` that keeps the product intact:

```js
// Output for a given input, ignoring fees.
function getAmountOut(amountIn, reserveIn, reserveOut) {
  return (reserveOut * amountIn) / (reserveIn + amountIn);
}

// Pool: 100 ETH, 300,000 USDC. Spot price = 3,000 USDC/ETH.
getAmountOut(1, 100, 300_000); // 2,970.29 USDC
getAmountOut(10, 100, 300_000); // 27,272.72 USDC → 2,727 per ETH
```

Notice what happened. The quoted spot price was 3,000, but selling one ETH got you 2,970, and selling ten got you an average of 2,727. That gap is slippage, and it is not a fee or a bug. It falls directly out of the curve: the more of one token you push in, the scarcer the other becomes, and the worse your marginal price gets. Big trade, small pool, bad price. The `x * y = k` hyperbola never lets the pool run out of either token, but it makes the last unit arbitrarily expensive.

Fees ride on top. A pool charging 30 basis points takes 0.3% of the input before the swap math runs, and that fee stays in the reserves, which is how `k` actually grows over time and how liquidity providers get paid.

## Concentrated liquidity: the same curve, on a leash

The obvious problem with the plain formula is that it spreads your capital across every price from zero to infinity. If you provide liquidity to a USDC/USDT pool, the curve dutifully reserves capital for the case where USDC trades at $12,000, which is capital doing nothing.

Concentrated liquidity, introduced in Uniswap v3 and carried into v4, lets a provider say "apply the constant product formula, but only between $0.998 and $1.002." Inside that band your capital behaves as if the pool were far deeper, so you earn a proportionally larger share of the fees for every dollar deployed. Step outside the band and your position stops trading entirely: it sits fully converted into whichever token is now the cheap one, earning nothing until price wanders back.

Uniswap v4 keeps that model and adds hooks, which let developers run custom logic at specific points in a pool's lifecycle, such as before a swap or after a liquidity change. That opens the door to dynamic fees that rise with volatility, or vaults that automatically re-center a provider's range as price moves. It also means the code sitting between you and the pool is now somebody's arbitrary contract, which is a different risk than the math.

## Why providing liquidity can lose to just holding

Here is the part people skip. Suppose you deposit 1 ETH and 3,000 USDC into a pool at $3,000. ETH then rallies to $4,000 on the open market. Arbitrageurs will buy ETH out of your pool until its internal price matches, which leaves the pool holding roughly 0.87 ETH and 3,464 USDC, about $6,928 at the new price. Had you simply held the original 1 ETH and 3,000 USDC, you would have $7,000.

That $72 gap is impermanent loss, and it is neither a hack nor a fee. It is the AMM mechanically selling your winner on the way up, and it grows with the size of the price move. Concentrated liquidity intensifies it, because a tight range means your position converts faster. [Uniswap's own documentation](https://support.uniswap.org/hc/en-us/articles/20904453751693-What-is-Impermanent-Loss) is blunt about this, and analyses of v3 positions have repeatedly found that a large share of providers in volatile pairs ended up behind, because fee income never caught up with the divergence. Stable pairs, where the two assets barely move relative to each other, see far less of it, which is exactly what the math predicts.

The takeaway is not that AMMs are broken. It is that "providing liquidity" is not a savings account. You are running a short-volatility strategy: you collect fees when price chops around, and you pay when it trends. Once you can see that in the curve, the yield numbers stop looking free and start looking like compensation for a risk you can actually name.
