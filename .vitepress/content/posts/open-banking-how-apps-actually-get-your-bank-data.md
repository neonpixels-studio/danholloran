---
date: "2026-07-18T02:07:52.000-05:00"
tags: ["finance", "fintech", "apis", "banking", "open-banking"]
draft: false
title: "Open Banking: How Apps Actually Get Your Bank Data"
image: "/images/posts/open-banking-how-apps-actually-get-your-bank-data.jpg"
topic: "finance"
description: "The mechanics behind connecting a budgeting app to your bank account, why screen scraping is dying, and where the US open banking rules stand in 2026."
---

You download a budgeting app, tap "connect your bank," pick your institution from a list, and a minute later every transaction from the last two years is sitting in the app. It feels like magic, or like a small security incident, depending on your mood. What actually happened is a chain of decisions about who holds your credentials, what a third party is allowed to see, and how long that access lasts. That chain is what people mean by "open banking," and in the US it is in the middle of an awkward, unresolved moment.

## The old way: handing over your password

For most of the last decade, connecting an app to your bank meant one thing under the hood: you typed your bank username and password into a screen the app controlled, and the app logged into your bank _as you_ to read the data. This is called screen scraping or credential sharing, and it is exactly as fragile as it sounds.

The app (or more often an aggregator working behind it) stores your login, visits the bank's website on a schedule, and parses whatever HTML comes back. When the bank redesigns its login page or adds a new prompt, the connection breaks and someone has to fix the scraper. Worse, the third party now holds credentials that can do anything you can do, not just read transactions. It is still surprisingly common. Industry groups estimate screen scraping still accounts for roughly one in four fintech data connections today.

## The new way: OAuth and tokens

The replacement is the same pattern that already powers "Sign in with Google." Instead of typing your bank password into the app, the app redirects you to your bank's own site. You log in there, on the bank's real domain, and you see a consent screen: this app wants read access to your checking account balance and transactions for the next 12 months. You approve, and the bank hands the app a **token** — a long random string that grants that specific, scoped, revocable access.

The token is the whole point. It is not your password. It cannot be used to log in, move money, or change your address. It only unlocks the exact data you agreed to, it expires, and you can revoke it from your bank's settings without changing anything else. If it leaks, the blast radius is a read-only view of some transactions, not your account.

In the US this flow is being standardized by the **Financial Data Exchange (FDX)**, an industry body whose API spec defines how banks expose data and how apps request it. FDX builds on OAuth 2.0 and the tighter FAPI security profile, and adoption is real: FDX reported over 130 million consumer accounts connected through its API in early 2026, up from about 114 million a year earlier. Fidelity, U.S. Bank, and others have stood up data-sharing hubs specifically to retire screen scraping.

## Where the aggregator sits

Most apps do not integrate with 10,000 banks directly. They pay an aggregator — Plaid, MX, Akoya, Finicity, and a handful of others — to be the universal adapter. The aggregator maintains connections to thousands of institutions, using the clean FDX/OAuth path where a bank offers one and falling back to scraping where it does not, then normalizes everything into one consistent format the app consumes.

A concrete version of the token flow looks like this:

```js
// The app never sees your bank password.
// 1. App asks the aggregator to start a connection
const { link_token } = await aggregator.createLinkToken({
  user,
  scopes: ["transactions"],
});

// 2. You're redirected to YOUR BANK to log in and consent
// 3. Bank issues a scoped token; app exchanges it for an access token
const { access_token } = await aggregator.exchange(public_token);

// 4. App pulls only what you approved
const txns = await aggregator.getTransactions(access_token, { start, end });
```

The tradeoff worth understanding: the aggregator becomes a concentrated holder of a lot of people's financial data. That is more secure than a hundred apps each storing your password, but it is also a bigger target, which is why data security and who counts as an authorized "representative" are exactly the questions regulators are fighting over.

## The rules are genuinely unsettled

Section 1033 of the Dodd-Frank Act says you have a right to your own financial data, and in October 2024 the CFPB finalized a rule to force banks to hand it over through free, standardized APIs, with the largest institutions due to comply in April 2026. Then the banks sued. A federal court in Kentucky enjoined the rule as likely exceeding the agency's authority, and rather than defend it, the CFPB reopened the rulemaking in August 2025 — including whether banks can charge fees for data access, which would flip the economics entirely.

So as of mid-2026, the technical direction is clear even though the legal one is not: the industry keeps migrating to tokenized APIs because they are simply better than scraping, while the binding federal rule sits in limbo and some states move to fill the gap. If you want to go deeper, the CFPB's [Personal Financial Data Rights page](https://www.consumerfinance.gov/personal-financial-data-rights/) tracks the reconsideration, and the FDX spec is the best window into how the plumbing is meant to work.
