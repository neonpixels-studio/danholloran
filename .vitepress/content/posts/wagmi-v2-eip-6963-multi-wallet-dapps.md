---
date: '2026-05-19T14:36:03.000+00:00'
tags: ['javascript', 'typescript', 'web-apis', 'crypto-web3']
draft: true
title: "Connecting Wallets the Right Way: wagmi v2 and EIP-6963"
image: '/images/posts/wagmi-v2-eip-6963-multi-wallet-dapps.jpg'
topic: 'development'
description: "The old window.ethereum trick breaks when users have multiple wallets installed. Here's how EIP-6963 and wagmi v2 solve multi-wallet discovery cleanly, with real TypeScript examples."
---

If you've ever built a dApp and had a user complain that "your site only shows MetaMask even though I have Coinbase Wallet installed," you've run headfirst into the `window.ethereum` problem. For years, every wallet browser extension raced to claim the same global, and whichever one loaded last won. The result was a constant arms race between wallet vendors and a genuinely terrible user experience.

EIP-6963 fixed that — and wagmi v2 makes the fix trivially easy to adopt. If you're still rolling your own wallet detection or using a library that hasn't caught up yet, this post is for you.

## The window.ethereum Problem and How EIP-6963 Solves It

The original EIP-1193 standard gave wallets a single attachment point: `window.ethereum`. One slot, many wallets, inevitable collisions. MetaMask and Coinbase Wallet both inject themselves there; whoever ran last overwrites the other.

EIP-6963 introduces an event-based discovery protocol instead. On page load, your dApp fires a `eip6963:requestProvider` event. Each installed wallet extension that supports the spec responds by emitting an `eip6963:announceProvider` event carrying its own provider object and metadata (icon, name, RDNS identifier). Your app collects the responses and builds a list — every wallet, no conflicts.

You *can* implement this yourself, but the raw event wiring is boilerplate you don't need to own:

```ts
// Low-level EIP-6963 — illustrative only, use wagmi instead
const providers: EIP6963ProviderDetail[] = [];

window.addEventListener('eip6963:announceProvider', (event: CustomEvent) => {
  providers.push(event.detail);
});

window.dispatchEvent(new Event('eip6963:requestProvider'));
```

The real-world issue is that you also need to handle providers announced *after* your request, de-duplicate by RDNS, manage lifecycle — it adds up. wagmi v2 handles all of it.

## Setting Up wagmi v2 with Multi-Wallet Support

wagmi v2 replaced its ethers.js dependency with [viem](https://viem.sh) — a lightweight, fully typed Ethereum library — and rebuilt its connector system from scratch. EIP-6963 discovery is enabled by default with the `injected()` connector.

Install the stack:

```bash
npm install wagmi viem @tanstack/react-query
```

Create your config:

```ts
// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),           // discovers ALL EIP-6963 wallets automatically
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
    coinbaseWallet({ appName: 'My dApp' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
```

Wrap your app with the providers:

```tsx
// main.tsx
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './lib/wagmi'

const queryClient = new QueryClient()

export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

That `injected()` connector does the EIP-6963 legwork automatically. When a user has three wallets installed, your connection UI will show all three.

## Building a Wallet Connection Component

With the config in place, wagmi's hooks give you everything you need. Here's a minimal but fully functional wallet picker:

```tsx
// components/WalletConnect.tsx
import { useConnect, useAccount, useDisconnect, useBalance } from 'wagmi'
import { formatEther } from 'viem'

export function WalletConnect() {
  const { connectors, connect, isPending } = useConnect()
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })

  if (isConnected && address) {
    return (
      <div>
        <p>
          {address.slice(0, 6)}…{address.slice(-4)} on {chain?.name}
        </p>
        {balance && (
          <p>{parseFloat(formatEther(balance.value)).toFixed(4)} ETH</p>
        )}
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {connector.name}
        </button>
      ))}
    </div>
  )
}
```

A few things worth noting here. `connectors` is populated at runtime based on what's actually available in the browser — if the user has MetaMask and Phantom installed, both show up. The `connector.uid` is stable across renders so it's safe as a React key. And `useBalance` returns a bigint value, which is where viem's `formatEther` utility comes in — it handles the wei-to-ether conversion without floating-point surprises.

For sending transactions, viem's type-safe primitives plug directly into wagmi's `useSendTransaction` hook:

```ts
import { useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'

const { sendTransaction } = useSendTransaction()

sendTransaction({
  to: '0xRecipientAddress',
  value: parseEther('0.01'),
})
```

## Where This Lands in Practice

EIP-6963 browser support is now effectively universal among modern wallet extensions — MetaMask, Coinbase Wallet, Phantom, Rabby, and most others have shipped it. Users with multiple wallets get a proper choice UI instead of a silent clobber. wagmi v2's default `injected()` connector handles the discovery without any extra configuration on your end.

If you're maintaining an older dApp that still reaches for `window.ethereum` directly, migrating to wagmi v2 is the cleanest upgrade path. The [wagmi docs](https://wagmi.sh/react/getting-started) are thorough, and the TypeScript types throughout viem make the contract interactions significantly less error-prone than working with ethers.js or raw JSON-RPC calls.
