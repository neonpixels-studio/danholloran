---
date: "2026-10-31T02:15:19.000-07:00"
tags: ["ai", "llm", "evals", "typescript"]
draft: false
title: "LLM Evals Start as Thirty Test Cases, Not a Platform"
image: "/images/posts/llm-evals-start-as-thirty-test-cases-not-a-platform.jpg"
topic: "ai"
description: "Most LLM features ship on vibes and break on the next prompt tweak. A small regression set, cheap deterministic checks, and a judge you actually calibrate will catch most of it."
---

You tweak a system prompt to fix one bad answer a user reported. You try it on that example, it looks great, you ship. Two days later someone notices the feature now ignores the output format half the time, or started apologizing in every reply, or quietly stopped handling a whole category of input. Nothing failed in CI, because nothing in CI knew what "correct" meant.

That is the gap evals fill. The word sounds like it needs a vendor, a dashboard, and a research team. It does not. The version that catches most regressions is a file of thirty or so real examples, a script that runs your feature against them, and a few assertions. You can write it this afternoon and grow it from there.

## Build the set from real failures

The most useful eval set is not synthetic. It is a list of inputs that have actually mattered: the bug reports, the weird edge cases from logs, the examples you hand-tested last time you changed the prompt. Each one gets an expected property, not necessarily an exact expected string.

Say you have a feature that classifies support tickets and extracts an order ID. A test case can look like this:

```ts
// evals/tickets.cases.ts
export interface EvalCase {
  id: string;
  input: string;
  expect: {
    category: "billing" | "shipping" | "bug" | "other";
    orderId?: string | null;
  };
}

export const cases: EvalCase[] = [
  {
    id: "refund-with-order",
    input: "I was charged twice for order #A-10293, please refund one.",
    expect: { category: "billing", orderId: "A-10293" },
  },
  {
    id: "no-order-id-present",
    input: "Your checkout page throws an error in Safari.",
    expect: { category: "bug", orderId: null },
  },
  {
    // Regression from a real report: the model invented an order ID
    id: "hallucinated-order-id",
    input: "Where is my package? It has been two weeks.",
    expect: { category: "shipping", orderId: null },
  },
];
```

The third case is the important pattern. Every time a user reports a bad output, it becomes a case before you touch the prompt. That way the fix is verified, and the bug can never quietly come back.

## Check cheaply first, judge second

Most of what goes wrong with LLM output is checkable with plain code: the JSON did not parse, a required field is missing, the category is not one of the allowed values, an ID appears that was never in the input. These checks are free, deterministic, and fast, so run them on every case.

```ts
// evals/run.ts
import { cases } from "./tickets.cases";
import { classifyTicket } from "../src/classifyTicket"; // your real feature

let failures = 0;

for (const c of cases) {
  const out = await classifyTicket(c.input);
  const problems: string[] = [];

  if (out.category !== c.expect.category) {
    problems.push(`category: got ${out.category}, want ${c.expect.category}`);
  }
  if ("orderId" in c.expect && out.orderId !== c.expect.orderId) {
    problems.push(`orderId: got ${out.orderId}, want ${c.expect.orderId}`);
  }
  // Grounding check: any ID we return must literally appear in the input
  if (out.orderId && !c.input.includes(out.orderId)) {
    problems.push(`orderId ${out.orderId} not present in input`);
  }

  if (problems.length) {
    failures++;
    console.log(`FAIL ${c.id}\n  ${problems.join("\n  ")}`);
  }
}

console.log(`${cases.length - failures}/${cases.length} passed`);
process.exit(failures ? 1 : 0);
```

Wire `node evals/run.ts` (or `tsx`) into a CI job that runs when prompt files or model config change, and you have a regression gate. Expect some run-to-run variance even at low temperature. Run flaky cases a few times and gate on a pass rate rather than demanding a perfect score on every run.

Only reach for a model-graded check, "LLM-as-judge," for properties code cannot see: tone, whether a summary is faithful, whether a reply actually answers the question. Tools like [promptfoo](https://www.promptfoo.dev/docs/configuration/expected-outputs/model-graded/llm-rubric) make this a few lines of config:

```yaml
tests:
  - vars:
      ticket: "I was charged twice for order #A-10293, please refund one."
    assert:
      - type: is-json
      - type: llm-rubric
        value: The reply acknowledges the double charge and does not promise a refund timeline.
```

## Do not trust the judge until you have checked it

A judge model is still a model. It has known biases: it tends to prefer longer answers, can favor outputs from its own model family, and can be swayed by the order in which options are shown. A judge score nobody has validated is a confident number, not a measurement.

The fix is cheap. Take forty or fifty outputs, label them pass or fail yourself, and run the judge on the same set. If it disagrees with you often, tighten the rubric until it does not, and repeat the check whenever you change the judge prompt or model. Judges also cost real money and latency on every run, so keep deterministic checks as the first line, run the judge only on the cases that need it, and cache results for unchanged outputs.

When does none of this make sense? If the "AI feature" is really a fixed transformation that a regex or a lookup table could handle, write that instead and test it normally. Evals exist because LLM output is probabilistic. Do not adopt that cost where you do not need it.

Start with the cases you already have in your head and your bug tracker, make every reported failure a new one, and treat a dropping pass rate exactly like a failing unit test. The platforms are useful once the set is large and you want trends over time, but the habit matters more than the tool.
