---
created_at: '2026-05-08T22:20:59.000+00:00'
tags: ['css', 'accessibility', 'web-apis']
draft: true
image: "/images/posts/css-customizable-select-finally-style-it-without-the-hacks.jpg"
title: 'CSS Customizable Select: Finally Style It Without the Hacks'
---

If you've ever had to match a `<select>` dropdown to a design system, you know the pain. The native element is essentially a black box — you can tweak font size and maybe a background color, but the moment a designer asks for a custom chevron, rounded options, or anything beyond the browser's defaults, you're reaching for a JavaScript-powered replacement. Libraries like Select2, Choices.js, or headless UI components exist almost entirely to paper over this one gap. That workaround era is ending.

The CSS customizable select landed in Chromium-based browsers in 2025, and as of 2026 it's gaining wider traction. It's a native opt-in that unlocks full CSS styling on the `<select>` element — including its dropdown picker, individual options, and the little chevron icon — without sacrificing keyboard navigation or accessibility semantics.

## Opting In with `appearance: base-select`

The whole thing is gated behind a single CSS declaration. Adding `appearance: base-select` to a `<select>` element tells the browser to switch it into a new rendering mode that's fully styleable. Browsers that don't recognize the value just ignore it and render the standard select, making this a solid progressive enhancement.

```css
select {
  appearance: base-select;

  /* Now you have full control */
  font-family: inherit;
  font-size: 1rem;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: #fff;
  color: #111827;
  cursor: pointer;
}

select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}
```

If you want to be explicit about targeting only supporting browsers, you can wrap styles in `@supports (appearance: base-select) { ... }` — useful when you want fallback styling for older browsers rather than just ignoring them.

## Styling the Picker and Its Parts

Once the element is opted in, a handful of new pseudo-elements become available. The dropdown container is exposed via `::picker(select)`, and you can use `:open` to target the button state when the picker is visible.

```css
/* Style the dropdown list itself */
select::picker(select) {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 0.25rem;
  margin-top: 4px;
}

/* Style individual options */
select option {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

select option:hover,
select option:checked {
  background-color: #eef2ff;
  color: #4338ca;
}

/* Replace the default chevron */
select::picker-icon {
  content: url("data:image/svg+xml,..."); /* your custom SVG */
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
}

/* Rotate the icon when open */
select:open::picker-icon {
  transform: rotate(180deg);
}
```

The `::checkmark` pseudo-element is also available to style the indicator shown next to the currently selected option inside the open picker — handy if you want a custom check icon instead of the browser default.

## Rich Option Content

One of the bigger wins here is that you can now put real HTML inside `<option>` elements — images, icons, spans — and have them render properly when the select is in base mode.

```html
<select>
  <option value="us">
    <img src="/flags/us.svg" alt="" width="20" height="14" />
    <span>United States</span>
  </option>
  <option value="de">
    <img src="/flags/de.svg" alt="" width="20" height="14" />
    <span>Germany</span>
  </option>
  <option value="jp">
    <img src="/flags/jp.svg" alt="" width="20" height="14" />
    <span>Japan</span>
  </option>
</select>
```

Previously, getting flag icons next to country names in a `<select>` meant ditching the native element entirely. Now it's just HTML. The browser still manages keyboard navigation, screen reader announcements, and form submission — you're not giving any of that up.

## Browser Support and When to Use It

As of mid-2026, customizable selects work in Chrome, Edge, and other Chromium-based browsers. Firefox and Safari support is in progress but not yet shipping widely. That browser picture matters for how aggressively you adopt this.

For internal tools or apps where you control the browser environment, you can lean in fully today. For public-facing products, the progressive enhancement angle is your friend: style it for supporting browsers, let it fall back to a plain native select elsewhere. The key difference from JS component approaches is that the fallback is still a real `<select>` — accessible, keyboard-navigable, and works without JavaScript — not a broken custom widget.

If your use case genuinely needs complex interactions (multi-select with search, grouped async options, virtualized lists), a JS library is still the right call. But for the common case of "make this dropdown match our design system," native CSS is now a real answer.

---

The Chrome for Developers blog has a solid deep-dive with live demos at [developer.chrome.com/blog/a-customizable-select](https://developer.chrome.com/blog/a-customizable-select), and the MDN docs on `::picker()` are worth bookmarking as the spec stabilizes. Start experimenting — the era of fighting with `<select>` is finally behind us.
