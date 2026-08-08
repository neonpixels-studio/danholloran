---
date: "2026-08-08T02:07:52.000-05:00"
tags: ["finance", "fintech", "compliance", "fraud", "kyc-aml-technology"]
draft: false
title: "KYC in the Deepfake Era: Why a Selfie Stopped Being Proof"
image: "/images/posts/kyc-in-the-deepfake-era-why-a-selfie-stopped-being-proof.jpg"
topic: "finance"
description: "The document-plus-selfie onboarding flow every fintech copied is quietly failing. Here is how identity verification actually works, why injection attacks broke it, and what the layered replacement looks like."
---

Every fintech onboarding flow looks the same. Snap a photo of your driver's license, take a selfie, wait for a spinner, and you have an account. That pattern has been the default for about a decade, and for most of that decade it worked well enough. It is now the weakest part of the stack.

The reason is not that deepfakes got prettier. It is that the attack moved. Face-swap and camera-injection tooling is sold as commodity software now, and vendors reporting on the 2024–2025 window describe injection attacks against face liveness rising several hundred percent year over year. Those numbers come from companies that sell the fix, so treat the exact figures with some skepticism. The direction is not in dispute: NIST rewrote its guidance around it, which is the part that actually matters.

## What KYC is actually required to do

Separate the legal requirement from the technology here, because people conflate them constantly.

In the US, the Customer Identification Program rule under Section 326 of the USA PATRIOT Act requires a bank to collect four things before opening an account: name, date of birth, address, and an identification number (a Social Security number for a US person, or an approved equivalent for a non-US person). That is the whole minimum. The rule then says the institution must have "risk-based procedures" sufficient to form a _reasonable belief_ that it knows the customer's true identity.

Note what that does not say. No selfie, no document scan, no named vendor or biometric. "Reasonable belief," risk-based, is a standard that moves as the threat moves — a method that formed reasonable belief in 2018 does not automatically form it in 2026. That is the entire story of what is happening right now.

The selfie-plus-license flow was never the requirement. It was one convenient way to satisfy it, and it became the default because it was cheap and users tolerated it.

## Presentation attacks versus injection attacks

Here is the distinction that broke the old model.

A **presentation attack** is what liveness detection was built for. Someone holds a printed photo, a phone screen, or a silicone mask up to the camera. The real camera captures a fake thing. Passive liveness detection looks for the tells: screen moiré, flat lighting, missing micro-movement, wrong depth cues. This works reasonably well and has for years.

An **injection attack** skips the camera entirely. The attacker uses a virtual camera driver, a rooted device, or a tampered client to feed a synthetic video stream directly into the verification pipeline. Concretely:

```
Presentation attack:  attacker → [phone screen] → real camera → SDK → server
Injection attack:     attacker → [virtual camera / patched client] → SDK → server
                                  ^ real camera never involved
```

Every signal a liveness model was trained to find lives in that first path. If the frames were never captured by a physical sensor, asking "does this look like it was captured by a physical sensor?" is a question the attacker gets to answer however they like. A synthetic feed can blink, turn its head, and follow an on-screen prompt, because it is being rendered in real time.

That is why NIST SP 800-63-4 treats presentation attack detection and injection attack detection as **two separate requirements** rather than one. For asynchronous remote identity proofing at IAL2, the guidance expects PAD, analysis of media for signatures of AI-generated content, _and_ a way to establish the integrity of the sensor and endpoint that produced the frames. Detecting the fake is no longer enough; you have to establish provenance of the capture itself.

## What the replacement looks like

Nobody serious is claiming a single detector solves this. The pattern that has emerged is layering independent signals so that defeating one does not defeat the chain:

- **Document forensics** — checking the physical security features, MRZ checksums, and font/print artifacts of the ID itself, not just OCR of the text on it.
- **Liveness with injection detection** — attesting the capture path, not just scoring the image. Device attestation, SDK integrity checks, and one-time challenges rendered server-side.
- **Behavioral and device signals** — device fingerprinting, geolocation consistency, keystroke and interaction dynamics, all folded into a composite risk score rather than a pass/fail gate.
- **Step-up for high-value events** — a stronger biometric or an out-of-band check reserved for the moments that actually carry loss, instead of front-loading all friction at signup.

The last one is the design shift worth internalizing. The old model treated onboarding as a checkpoint: pass once, you are trusted forever. AML was always the counterweight to that, monitoring transactions and screening against sanctions lists after the fact. The current direction collapses the two, treating identity as a confidence score that gets re-evaluated at every risky action rather than a boolean stamped at account creation.

If you are building on top of a verification vendor, the useful question to ask is not "what is your deepfake detection accuracy." Detection accuracy on a benchmark set tells you almost nothing about live adversarial performance. Ask instead how they establish that the frames came from a real sensor on a real device, and what happens to their pass rate when they cannot. The honest answers are more interesting than the marketing ones.

**Further reading:** [NIST SP 800-63A, Digital Identity Guidelines: Enrollment and Identity Proofing](https://pages.nist.gov/800-63-3/sp800-63a.html) and the [FFIEC BSA/AML Examination Manual section on Customer Identification Programs](https://bsaaml.ffiec.gov/manual/AssessingComplianceWithBSARegulatoryRequirements/01).
