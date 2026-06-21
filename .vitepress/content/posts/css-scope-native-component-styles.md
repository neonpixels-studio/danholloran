---
date: "2026-06-21T07:08:32.000+00:00"
tags: ["css", "web-apis", "tooling", "performance"]
draft: false
title: "CSS @scope: Component-Scoped Styles Are Now Native"
image: "/images/posts/css-scope-native-component-styles.jpg"
topic: "development"
description: "CSS @scope reached full browser support in December 2025 — here's how to use it to write component-scoped styles without CSS Modules, BEM, or a build step."
---

You've been writing `.card__title` and `.card__title--featured` for years. Or reaching for CSS Modules because you're tired of class name collisions. Or adding Styled Components to your project just to keep button styles from leaking out of your button component. These are all reasonable solutions to the same underlying problem: CSS is global by default.

In December 2025, Firefox 146 shipped `@scope` support, giving it full coverage across Chrome, Safari, and Firefox. It's now a Baseline feature. There's a native way to limit the reach of your CSS selectors — no build tool required.

## What @scope Does

The `@scope` at-rule defines a scoping root — the element where a set of styles starts applying — and an optional scoping limit — where they stop. Anything outside those bounds is unaffected.

The simplest form sets a named root:

```css
@scope (.card) {
  h2 {
    font-size: 1.25rem;
    color: var(--color-heading);
  }

  p {
    color: var(--color-muted);
  }
}
```

That `h2` rule now only targets `<h2>` elements inside `.card`. An `h2` anywhere else on the page is completely unaffected — even without any extra class names or specificity tricks. The `:scope` pseudo-class lets you target the root element itself:

```css
@scope (.card) {
  :scope {
    border-radius: 8px;
    padding: 1.5rem;
    background: white;
  }
}
```

`&` works as an alias for `:scope` inside the block, so this is equivalent:

```css
@scope (.card) {
  & {
    border-radius: 8px;
  }
}
```

## Donut Scope: Defining Where Styles Stop

The real power comes from the `to` keyword. You can define a lower boundary — a "scope limit" — where the styles stop applying. This is called donut scope, because the scope root and scope limit form the outer ring while a "hole" punches through at the limit.

```css
@scope (.card) to (.card-footer) {
  p {
    color: var(--color-body);
  }
}
```

Here, `p` elements inside `.card` get styled — except for any `p` inside `.card-footer`. The styles don't leak into that nested section. This is particularly useful for components that accept slotted content from other components: you can scope the outer component's styles precisely without accidentally reaching into its children's territory.

A concrete pattern that comes up often: a sidebar layout that wraps a widget area.

```css
@scope (.sidebar) to (.widget) {
  a {
    color: var(--sidebar-link-color);
    text-decoration: none;
  }
}
```

Links in the sidebar get styled, but links inside individual widgets are left alone. Each widget can define its own link styles without fighting specificity.

## @scope in Style Blocks

Where `@scope` gets genuinely interesting for component-driven development is inside `<style>` blocks embedded in HTML. When you omit the selector in a `<style>` block's `@scope`, the scope root automatically becomes the parent element of that `<style>` tag:

```html
<article class="post-card">
  <style>
    @scope {
      h2 {
        font-size: 1.5rem;
      }
      p {
        color: #555;
      }
    }
  </style>

  <h2>Post Title</h2>
  <p>Post excerpt...</p>
</article>
```

Those styles apply only to the content inside `.post-card`. Paste the same markup twice on the page and you won't get any bleed between instances, because each `<style>` block scopes to its own parent.

This closes the gap between how frameworks like Vue and Svelte handle `<style scoped>` and what browsers natively support. In framework components you write styles alongside markup and expect them to stay contained. Now you can do the same in plain HTML — useful for server-rendered partials, Web Components without a shadow DOM, or just tightly coupling a component's markup and styles in one template file.

The tradeoff: when you reuse a component, the `<style>` block renders with each instance. That's not DRY, and it means the browser parses that CSS repeatedly. For one-off page sections it's fine. For a component rendered fifty times in a list, an external stylesheet with an explicit `@scope (.card)` block is the better call.

## Practical Tradeoffs

`@scope` is a genuine alternative to naming conventions like BEM, not a wholesale replacement for everything in your CSS architecture. It works well alongside external stylesheets — global resets and design tokens stay global, component-specific rules get scoped.

Browser support is now solid. Chrome has had it since 118, Safari since 17.4, and Firefox since 146 (December 2025). No polyfill required for modern target browsers.

Where it doesn't help: if you're using a utility-first framework like Tailwind, you're already avoiding the global-selector problem a different way. `@scope` is most valuable when you write semantic CSS — element selectors, modifier classes — and want containment without specificity wars.

For teams not yet on CSS Modules or a CSS-in-JS solution, `@scope` is the lowest-friction way to start writing styles that don't bleed. And for those already using those tools, it's worth knowing the browser now ships the same capability natively.

MDN's full reference is at [developer.mozilla.org/en-US/docs/Web/CSS/@scope](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@scope).
