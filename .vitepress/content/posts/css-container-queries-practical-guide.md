---
created_at: "2025-12-02T18:47:00.000-08:00"
tags: ["css", "javascript"]
draft: false
title: "CSS Container Queries: A Practical Guide for Component-Based Layouts"
image: "/images/posts/css-container-queries-practical-guide.jpg"
topic: "development"
description: "Container queries finally give us components that adapt to their context, not just the viewport. Here's how to use them effectively in real projects."
---

Media queries have been the backbone of responsive design for over a decade, but they've always had a fundamental mismatch with component-based architecture: a component doesn't know how big it is, only how big the viewport is. Container queries fix this. They're now supported in all major browsers and ready for production use.

## The Core Concept: Containment First

Before a container query can work, you need to declare a _containment context_ on the parent element. This tells the browser to track the size of that element so its children can query against it:

```css
.card-wrapper {
  container-type: inline-size;
  /* optional: give it a name for targeting */
  container-name: card;
}

/* shorthand */
.card-wrapper {
  container: card / inline-size;
}
```

With `inline-size` containment, child elements can query the wrapper's width. Use `size` if you also need to query height (less common but valid for things like modal dialogs).

## Writing Container Queries

The syntax mirrors media queries closely, which makes the learning curve gentle:

```css
/* Base styles — small card layout */
.card {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.card__image {
  width: 100%;
  aspect-ratio: 16/9;
}

/* When the container is at least 480px wide, go horizontal */
@container card (min-width: 480px) {
  .card {
    flex-direction: row;
    align-items: center;
  }

  .card__image {
    width: 200px;
    flex-shrink: 0;
    aspect-ratio: 1;
  }
}

/* At 700px, show extra metadata */
@container card (min-width: 700px) {
  .card__meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
}
```

The `.card` component now adapts wherever it's placed — a sidebar, a main content area, a modal — without any JavaScript and without knowing anything about the page layout surrounding it.

## Container Query Units

There's a bonus feature that's easy to miss: container query length units. These let you size things relative to the container, not the viewport:

```css
.card__title {
  /* 5% of the container's inline size */
  font-size: clamp(1rem, 5cqi, 2rem);
}
```

The available units are:

- `cqi` — 1% of the container's inline size (usually width)
- `cqb` — 1% of the container's block size (usually height)
- `cqw` / `cqh` — container width / height (not relative to writing mode)
- `cqmin` / `cqmax` — the smaller / larger of cqw and cqh

These are particularly useful for fluid typography inside components, since you can now have typography that scales with the component width rather than the viewport width.

## Combining with Grid Auto-Placement

A pattern that saves a lot of JavaScript is combining container queries with CSS Grid to create automatically responsive grids inside any container:

```css
.grid-container {
  container-type: inline-size;
}

.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

@container (min-width: 600px) {
  .auto-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
```

Drop this into any layout and the grid adapts to whatever space it's given — no viewport knowledge required.

Container queries represent a meaningful shift in how we think about responsive design: from page-centric to component-centric. Start pulling your breakpoint logic out of media queries and into container queries wherever your components live in multiple contexts, and you'll find your layouts become dramatically easier to reason about.
