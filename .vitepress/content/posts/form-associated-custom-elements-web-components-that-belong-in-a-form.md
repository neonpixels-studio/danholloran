---
date: "2026-08-24T02:07:50.000-05:00"
tags: ["javascript", "accessibility", "css", "web-apis"]
draft: false
title: "Form-Associated Custom Elements: Web Components That Belong in a Form"
image: "/images/posts/form-associated-custom-elements-web-components-that-belong-in-a-form.jpg"
topic: "development"
description: "Custom elements can be real form controls. Here is how formAssociated, ElementInternals, and setValidity retire the hidden-input hack for good."
---

Custom elements have been shippable for years, but the illusion falls apart the moment you drop one inside a `<form>`. The value never shows up in `FormData`. `required` does nothing. Hitting reset leaves your control sitting there with stale state, and the browser's validation bubble refuses to point at it. So most of us reach for the same workaround: render a hidden `<input>` inside the component and keep it in sync by hand, forever.

That workaround has been unnecessary for a while now. Form-associated custom elements are Baseline — Chromium, Firefox, and Safari 16.4 and up — and they let a component participate in a form as a first-class control instead of a decoration sitting next to one.

## Two lines make it a form control

The whole thing hinges on a static property and one method call:

```js
class RatingInput extends HTMLElement {
  static formAssociated = true;

  #internals;
  #value = "";

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div role="radiogroup" aria-label="Rating">
        ${[1, 2, 3, 4, 5]
          .map(
            (n) =>
              `<button part="star" type="button" value="${n}">&#9733;</button>`,
          )
          .join("")}
      </div>
    `;
    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.matches("button")) this.value = e.target.value;
    });
  }

  get value() {
    return this.#value;
  }

  set value(v) {
    this.#value = String(v);
    this.#internals.setFormValue(this.#value);
  }
}

customElements.define("rating-input", RatingInput);
```

`static formAssociated = true` tells the browser to treat the element like a form control: it gets picked up by the owning form, it inherits `name`, and it becomes eligible for validation. `attachInternals()` hands back an `ElementInternals` object, which is the private channel your component uses to talk to the form. Guard it — anything you can do through internals is something you probably do not want page scripts doing on your behalf, which is why it lives in a private field.

`setFormValue()` is the part that ends the hidden-input era. Pass it a string, a `File`, or a whole `FormData` object when one control needs to contribute several named values, and it lands in the submission:

```html
<form id="review">
  <rating-input name="score" required></rating-input>
  <button>Submit</button>
</form>
```

```js
new FormData(document.getElementById("review")).get("score"); // "4"
```

## The lifecycle you get for free

Being form-associated also opts you into callbacks the browser fires at the right moments, so you stop wiring up listeners for things the platform already knows:

```js
formResetCallback() {
  this.value = '';
}

formDisabledCallback(disabled) {
  this.toggleAttribute('inert', disabled);
}

formStateRestoreCallback(state) {
  this.value = state;
}
```

`formResetCallback` runs on `form.reset()`. `formDisabledCallback` fires when the element or its enclosing `<fieldset>` gets disabled, which is the case almost everyone forgets. `formStateRestoreCallback` is the one that quietly wins arguments in code review: it restores state on back-navigation and session restore, using the optional second argument to `setFormValue(value, state)`. If your control's submission value differs from what the user actually typed — a formatted currency field, say — pass the raw input as that second argument and you get real state restoration instead of an empty box.

## Validation the browser actually understands

`setValidity()` is where custom controls finally stop being second-class:

```js
#validate() {
  const empty = this.hasAttribute('required') && !this.#value;

  this.#internals.setValidity(
    empty ? { valueMissing: true } : {},
    empty ? 'Please choose a rating.' : '',
    this.shadowRoot.querySelector('button'),
  );
}
```

The first argument is a `ValidityStateFlags` dictionary using the same flag names as native inputs (`valueMissing`, `rangeUnderflow`, `customError`, and so on). The second is the message. The third — the anchor — is the one people skip and then wonder why nothing appears: it is the element the browser points its validation bubble at. Without an anchor inside your shadow root, Chromium has nowhere to render the message and silently gives up.

Get this right and `form.reportValidity()`, implicit submit blocking, and the `:invalid` pseudo-class all work against your component exactly as they do against `<input required>`.

## Styling states without attribute soup

The same `ElementInternals` object carries a `states` set, so internal state no longer has to leak out as a reflected attribute:

```js
this.#internals.states.add("rated");
this.#internals.states.delete("rated");
```

```css
rating-input:state(rated)::part(star) {
  color: gold;
}
```

`:state()` has been Baseline since 2024 and composes with `:host()` and `::part()`, which means consumers can style your component's states without you publishing a contract of magic class names.

None of this is new enough to be risky anymore, and it collapses a surprising amount of glue code. Next time you are about to add a hidden input to a component, open the [`ElementInternals` docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) instead and delete it before it exists.
