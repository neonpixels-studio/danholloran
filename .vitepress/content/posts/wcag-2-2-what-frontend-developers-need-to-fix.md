---
date: "2026-06-18T07:09:03.000+00:00"
tags: ["accessibility", "wcag", "html", "css", "frontend"]
draft: false
title: "WCAG 2.2: What Frontend Developers Actually Need to Fix"
image: "/images/posts/wcag-2-2-what-frontend-developers-need-to-fix.jpg"
topic: "development"
description: "WCAG 2.2 became the enforcement standard in 2026. Here are the nine new success criteria that matter most for frontend developers — and what to actually do about them."
---

If accessibility audits still reference WCAG 2.1 at your company, you're behind. WCAG 2.2 became a W3C Recommendation in October 2023 and is now the version that regulators, auditors, and legal teams point to. In the US, the Department of Justice formally adopted WCAG 2.1 AA as the ADA standard — but in practice, WCAG 2.2 is what modern audits check. The European Accessibility Act, which hit full enforcement for digital products in 2025, also tracks WCAG 2.2.

The good news: WCAG 2.2 is backward compatible. If you're already meeting 2.1 AA, you're not starting over. You have nine new success criteria to address, and several of them are things you probably already knew you should fix.

## Focus Indicators: The Changes That Matter Most

Two of the nine new criteria deal with focus, and they're the ones that trip up the most component libraries and design systems.

**Focus Not Obscured (SC 2.4.11, Level AA)** says a focused element can't be _entirely_ hidden by author-created content. Sticky headers, floating chat widgets, cookie consent banners, and modal overlays are the usual culprits. The rule doesn't require the whole element to be visible — just that it's not completely covered. SC 2.4.12 (Level AAA) goes further and requires the full component to be visible.

**Focus Appearance (SC 2.4.11 at AA, 2.4.13 at AAA)** finally gives numbers to what a visible focus indicator looks like. At the AA level, the focus indicator must have a perimeter at least as long as the unfocused component's perimeter, and the color change between focused and unfocused states must have a contrast ratio of at least 3:1. The browser default outline in Chrome and Safari passes — `outline: none` without a replacement does not.

In practice, these two criteria mean: never `outline: none` without an alternative, and test keyboard navigation on any page that has sticky or fixed-position elements. A quick scroll-and-tab through your interface catches most Focus Not Obscured violations immediately.

```css
/* Bad — removes focus ring with no replacement */
:focus {
  outline: none;
}

/* Good — custom ring that meets contrast + size requirements */
:focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 2px;
}
```

Using `:focus-visible` instead of `:focus` means keyboard users see the indicator while mouse users aren't distracted by it. All modern browsers support it.

## Touch Targets and Dragging

**Target Size Minimum (SC 2.5.8, Level AA)** requires interactive elements to have a target size of at least 24×24 CSS pixels. The rule applies to the target itself, not just the visual rendering — spacing counts if it pushes adjacent targets apart. Buttons, links in navigation, and icon-only controls are the places to check. There are exceptions: inline text links and elements whose size is determined by the browser default (like native checkboxes without custom styling) are exempt.

**Dragging Movements (SC 2.5.7, Level AA)** requires that any functionality using a drag operation has a single-pointer alternative. A sortable list that only works via drag-and-drop fails this criterion unless there's also an up/down button, a cut-and-paste mechanism, or some other way to accomplish the same task without dragging. If you're using a drag library like `dnd-kit` or `react-beautiful-dnd`, this is worth auditing.

## Authentication and Forms

**Accessible Authentication (SC 3.3.8 at AA, 3.3.9 at AAA)** is the criterion that generated the most discussion when 2.2 dropped. It says a cognitive function test — remembering a password, solving a CAPTCHA, transcribing characters — cannot be required as the _only_ way to authenticate. The criterion doesn't ban passwords, but it does require that if you use a password, users can paste into the field (so password managers work), autofill is allowed, or a copy mechanism is available.

In practical terms: don't block paste on password inputs, don't disable autocomplete on login forms, and consider adding magic links or passkeys as alternatives.

**Redundant Entry (SC 3.3.7, Level A)** says information already provided in a multi-step process shouldn't be required again — unless there's a security or validity reason. A checkout flow that asks for billing address, then asks for the same address again on a review screen, fails this criterion. The fix is either to pre-fill or carry information forward between steps.

## Where to Go From Here

The fastest way to catch most of these issues is to run your UI through a keyboard-only navigation pass and check with an automated tool like axe or Lighthouse — though automated tools catch only about 30–40% of accessibility issues, so manual testing matters. For WCAG 2.2 specifically, the new criteria around focus, target size, and authentication aren't well-detected by automated scanners yet.

WCAG 3.0 is on the horizon — a March 2026 Working Draft landed with 174 requirements and a new scoring model that moves away from the binary pass/fail system — but it's realistically 2028–2030 before it's a Recommendation. WCAG 2.2 is what you need to ship against right now.

The nine new criteria aren't a massive lift if you tackle them systematically. Start with focus indicators (they're the most commonly broken), then work through target sizes and authentication, and you'll be in solid shape for any current accessibility review.
