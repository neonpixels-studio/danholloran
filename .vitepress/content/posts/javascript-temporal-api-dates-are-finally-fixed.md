---
date: "2026-05-03T19:54:56.000+00:00"
tags: ["javascript", "web-apis", "typescript"]
draft: false
image: "/images/posts/javascript-temporal-api-dates-are-finally-fixed.jpg"
title: "JavaScript Temporal API: Dates Are Finally Fixed"
topic: development
description: "A practical introduction to the JavaScript Temporal API — the ES2026 replacement for Date that gets types right, handles timezones properly, and makes date arithmetic readable without moment.js or date-fns."
---

`new Date()` was already problematic in 1995. It was based on Java's `java.util.Date`, which the Java team themselves deprecated years later. And yet here we are, still calling `getMonth()` on an object that returns 0 for January, still manually converting UTC offsets, still installing moment.js to do things the language should handle natively.

That era is over. The Temporal API reached TC39 Stage 4 in March 2026 and shipped as part of ES2026. It's live in Chrome 128+, Firefox 135+, Safari 18+, and Node.js 24+. If you've been reaching for date-fns or dayjs to paper over `Date`'s gaps, you can stop.

## The Type System Makes Sense Now

The biggest conceptual shift Temporal brings is a proper set of types. `Date` conflated everything — a timestamp, a local date, a timezone-aware moment — into one object. Temporal separates them:

- **`Temporal.PlainDate`** — a calendar date with no time, no timezone. Use this for birthdays, deadlines, calendar events.
- **`Temporal.PlainDateTime`** — a date and time with no timezone. Good for "noon on Tuesday" when timezone doesn't matter.
- **`Temporal.ZonedDateTime`** — a full moment in time anchored to a specific IANA timezone. Use this when DST matters.
- **`Temporal.Instant`** — a raw UTC timestamp, like `Date` but without the quirks.

```js
// A date with no time attached
const deadline = Temporal.PlainDate.from("2026-06-15");
console.log(deadline.month); // 6 — not 5. Months are 1-indexed.

// A timezone-aware moment
const meeting = Temporal.ZonedDateTime.from(
  "2026-06-15T14:00:00[America/Chicago]",
);
console.log(meeting.hour); // 14
```

Picking the right type up front eliminates a whole class of bugs where you meant "a date" but got "a date interpreted in UTC" (or local time, depending on the method).

## Arithmetic That Actually Works

Date arithmetic with the old `Date` object meant converting to milliseconds, doing math, and converting back — and it still got DST wrong. Temporal's types all have `.add()`, `.subtract()`, and `.until()` built in, and they handle calendar edge cases automatically.

```js
const start = Temporal.PlainDate.from("2026-01-31");

// Add one month — Temporal clamps to the last valid day
const next = start.add({ months: 1 });
console.log(next.toString()); // '2026-02-28'

// How many days between two dates?
const end = Temporal.PlainDate.from("2026-06-15");
const diff = start.until(end, { largestUnit: "day" });
console.log(diff.days); // 135
```

The DST story with `ZonedDateTime` is even better. If you add one day to a `ZonedDateTime` that spans a DST change, Temporal aims for "the same wall-clock time the next day" rather than blindly adding 86,400 seconds — which is what you almost always want.

```js
// Clocks spring forward on March 8 in New York
const before = Temporal.ZonedDateTime.from(
  "2026-03-08T09:00:00[America/New_York]",
);
const after = before.add({ days: 1 });
console.log(after.toString());
// '2026-03-09T09:00:00-04:00[America/New_York]'
// Still 9am — not 8am or 10am
```

## Comparing and Formatting

Temporal objects are immutable and support direct comparison with `.compare()`, which returns -1, 0, or 1. This makes sorting trivial:

```js
const dates = [
  Temporal.PlainDate.from("2026-09-01"),
  Temporal.PlainDate.from("2026-03-15"),
  Temporal.PlainDate.from("2026-06-30"),
];

dates.sort(Temporal.PlainDate.compare);
// → ['2026-03-15', '2026-06-30', '2026-09-01']
```

For formatting, Temporal integrates with the existing `Intl.DateTimeFormat` API. You convert to a `Date` or use the format options directly depending on your use case, and locale-aware formatting works the same way it always has.

```js
const dt = Temporal.Now.zonedDateTimeISO("America/New_York");
const formatted = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: dt.timeZoneId,
}).format(new Date(dt.epochMilliseconds));

console.log(formatted); // 'May 3, 2026 at 3:54 PM'
```

## Dropping the Libraries

If you're currently using date-fns, dayjs, or moment.js primarily for arithmetic, formatting, or timezone handling, Temporal covers all of it natively. The polyfill (`@js-temporal/polyfill`) is available if you need to support older environments, but with full browser support now landed, most greenfield projects can skip it entirely.

The migration path from `Date` to Temporal is mostly mechanical: `Temporal.Instant.fromEpochMilliseconds(date.getTime())` converts a legacy `Date` object into the Temporal world, and `new Date(instant.epochMilliseconds)` goes the other way. For TypeScript users, the types are clean and fully inferred.

Thirty years is a long time to wait for a good date API. It's here now — no library required.
