---
date: '2026-11-14T02:16:12.000-08:00'
tags: ['ai', 'agents', 'security', 'typescript', 'human-in-the-loop']
draft: false
title: "Human-in-the-Loop Approvals: Pausing the Agent Is the Easy Part"
image: '/images/posts/human-in-the-loop-approvals-pausing-the-agent-is-the-easy-part.jpg'
topic: 'ai'
description: "Agent SDKs make approval gates a one-line flag. What decides whether they protect you is the approval screen, the policy behind it, and what happens on resume."
---

Every agent framework now ships an approval gate. Mark a tool as sensitive, and when the model tries to call it, the run pauses and waits for a person to say yes or no. It takes one line to turn on, and it's easy to come away thinking the safety question is settled.

It isn't. An approval prompt that shows "The agent wants to cancel an order. Approve?" forty times a day trains your users to click Approve without reading, which is worse than no prompt, because now there's a record saying a human signed off. The pause is the easy part. The hard parts are deciding what gets gated, what the reviewer actually sees, and what happens between "approved" and "executed."

## The mechanics take five minutes

Here's the OpenAI Agents SDK for TypeScript. Vercel's AI SDK has the same idea through a `needsApproval` option on tools, so the pattern carries over.

```ts
import { Agent, run, tool } from '@openai/agents'
import { z } from 'zod'

const cancelOrder = tool({
  name: 'cancel_order',
  description: 'Cancel a customer order.',
  parameters: z.object({ orderId: z.number() }),
  needsApproval: true,
  async execute({ orderId }) {
    return `Cancelled order ${orderId}`
  },
})

const agent = new Agent({
  name: 'Support agent',
  instructions: 'Use cancel_order to handle cancellation requests.',
  tools: [cancelOrder],
})

let result = await run(agent, 'Cancel order 123.')

if (result.interruptions?.length) {
  const state = result.state
  for (const interruption of result.interruptions) {
    // In a real app, this is where a person (or a policy) decides.
    state.approve(interruption)
  }
  result = await run(agent, state)
}
```

When the model calls `cancel_order`, the tool doesn't execute. The run returns `interruptions` and a resumable `state`. You approve or reject each item, then pass the same state back to `run` to continue the same run instead of starting a new turn. If the review could take hours, the docs say to serialize the state, store it, and resume when the decision arrives. `needsApproval` can also be a function that returns a boolean, so you can gate only some calls.

That loop is where most tutorials stop. Here's what it leaves out.

## Show the arguments, not the model's story

The most tempting approval UI is the model's own explanation: "I'm going to refund the customer because the item arrived damaged." It reads nicely, and you should never rely on it. That sentence was written by the same model whose action you're checking. If an attacker slipped instructions in through a support ticket or a retrieved web page, the explanation will be just as convincing as the action is wrong.

Render the actual tool name and the actual arguments, resolved into something a person can check:

```ts
type ApprovalCard = {
  tool: string
  args: Record<string, unknown>
  impact: string // computed by your code, not the model
}

async function describeRefund(args: { orderId: number; amountCents: number }): Promise<ApprovalCard> {
  const order = await db.orders.find(args.orderId)
  return {
    tool: 'refund_order',
    args,
    impact: `Refund $${(args.amountCents / 100).toFixed(2)} of $${(order.totalCents / 100).toFixed(2)} to ${order.customerEmail}`,
  }
}
```

"Refund $940.00 of $94.00" is the kind of mismatch a reviewer catches in a second. "I'm processing the customer's refund" hides it.

## Gate by blast radius, not by tool

If every call to a tool needs approval, reviewers get tired and stop reading. Sort actions by how bad a mistake would be:

- **Reversible and cheap:** drafting an email, adding a label, reading data. No gate. Log it.
- **Reversible but visible:** sending an email to the user who asked, updating a ticket. Gate only above a threshold, like new recipients or bulk changes.
- **Irreversible or external:** money movement, deletes, anything that leaves your system. Always gate, and show the computed impact.

Put that policy in your own code, not in the system prompt. The model can be talked out of a prompt instruction. It can't be talked out of an `if` statement that runs after it has made its call.

## Approval isn't authorization

Two failures show up once real users are clicking the button.

First, **check permissions at execution time, not just at approval time.** The person who clicks Approve has to be allowed to do the action themselves. A support agent approving a $5,000 refund they couldn't issue by hand is privilege escalation with extra steps. Check again inside `execute`, because the state may have sat in a queue while roles changed.

Second, **make execution idempotent.** Serialized state plus a resume step means the same approval can get replayed: a retry after a timeout, a double-click, a worker that crashed after the side effect but before saving. Key each side effect on the tool call ID and refuse to run it twice. Also store who approved what and when, since the SDK records the decision but not your audit trail.

Rejections need care too. A rejected call shouldn't be a dead end. Give the model a short reason ("amount exceeds order total") so it can correct itself or explain to the user, rather than retrying the same call.

## Where to go from here

Start by listing every tool your agent can call and sorting them into the three tiers above. If nothing lands in the last tier, you may not need an approval flow at all. If everything does, the agent probably has more access than the job needs, and narrowing its tools is a better fix than adding prompts. The OpenAI docs on [guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) and the AI SDK's [human-in-the-loop cookbook](https://ai-sdk.dev/cookbook/next/human-in-the-loop) cover the APIs. The approval screen and the policy behind it are your job.
