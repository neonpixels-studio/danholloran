---
date: "2026-11-03T02:16:12.000-08:00"
tags: ["obsidian", "plugins", "workflows", "bases"]
draft: false
title: "Obsidian Maps: Put Your Place Notes on a Map With Bases"
image: "/images/posts/obsidian-maps-put-your-place-notes-on-a-map-with-bases.jpg"
topic: "obsidian"
description: "The official Maps plugin turns any Base into an interactive map. Here's how to structure coordinates, drive marker icons and colors from properties, and avoid the setup traps."
---

Most vaults are full of places. Restaurants you want to try, apartments you toured, a client's office, the trailhead from last spring, every city you've worked from. They usually live as a folder of notes or a tag, and the only way to answer "what's near here?" is to open each one and squint at an address.

Obsidian's [Maps plugin](https://github.com/obsidianmd/obsidian-maps) fixes that without asking you to move anything. It adds a **Map** layout to Bases, so any set of notes a Base can filter, it can also pin. The markers come from your properties, the filters are the same filters you already use, and nothing gets locked into a separate database.

## Setting it up

Maps is an official plugin from the Obsidian team, but it ships as a **Community plugin**, not a Core one. It needs Obsidian 1.10 or later.

1. Go to Settings → Community plugins → Browse.
2. Search for **Maps**, then install and enable it.
3. Open any Base, choose **Add view**, and set the layout to **Map**.

On its own, that gives you an empty map. Markers appear only for notes that have a coordinates property, so the real work is in your frontmatter. The plugin accepts either a text property or a two-item list, always latitude first:

```yaml
---
coordinates: "38.6270, -90.1994"
icon: "utensils"
color: "orange"
tags:
  - places
  - food
visited: false
---
```

The list form works too, and it's what Obsidian's help example uses:

```yaml
coordinates:
  - "38.6270"
  - "-90.1994"
```

Then, in the view settings, point **Marker coordinates** at your `coordinates` property and add a filter such as `file.hasTag("places")`. Every note that matches shows up as a pin. Click a pin and you get a preview card with that note's properties.

To grab coordinates without leaving Obsidian, right-click a spot on the map and choose **Copy coordinates**. That one shortcut is most of what makes the workflow stick. Paste the value into a property and the pin shows up right away.

## Let properties drive the markers

A map where every pin looks the same is only slightly better than a list. The view settings let you choose a property for **marker icons** and one for **marker colors**. Icons use names from the [Lucide](https://lucide.dev/icons/) set that Obsidian already bundles (`landmark`, `utensils`, `tent`, `building`). Colors take any CSS value: a named color, a hex code, `rgb()`, or a theme variable like `var(--color-blue)`.

Setting `icon` on every note gets tedious fast, and this is where Bases formulas come in. The help docs show a nice trick: give each place a `type` property that links to a category note, and store the icon on the category note instead.

```yaml
# In "Restaurants.md"
---
icon: "utensils"
---
# In "Corner Taqueria.md"
---
type: "[[Restaurants]]"
coordinates: "38.6353, -90.2318"
tags:
  - places
---
```

Then add a formula property to the Base and pick it as the marker icon:

```js
list(type)[0].asFile().properties.icon;
```

Now changing one category note re-skins every pin of that type. The same pattern works for color, or you can compute color from state. This one turns places you've already been to green and leaves the rest gray:

```js
if(visited, "green", "gray")
```

If an older batch of notes stores `latitude` and `longitude` as separate properties, you don't have to rewrite them. Add a formula property defined as `[latitude, longitude]` and use that as the marker coordinates.

You can also add a formula that links out to a real mapping app, so the preview card does double duty as directions:

```js
link(
  "https://www.google.com/maps/search/" + file.name.replace(" ", "+"),
  "Google Maps",
);
```

## Where it earns its place (and where it doesn't)

The win isn't the map itself. It's that the map is just another view over notes you already keep. A single `Places.base` can hold a table for editing, a cards view for browsing, and a map for planning, all sharing one set of filters. Embed the map view in a trip note or a daily note and it updates as you add places. For example, a "Weekend in Chicago" note can embed a view filtered to `tags` containing `chicago`. Every place you clip during the week then shows up on the map with no manual upkeep.

A few things to know before you commit:

- **No geocoding.** The plugin won't turn an address into coordinates. You either paste coordinates or add them with a script or another tool. If you have hundreds of address-only notes, budget time for a one-off backfill.
- **Latitude comes first.** Copying from a GeoJSON source, which uses longitude first, will drop your pins in the ocean. If a marker shows up somewhere odd, check the order before anything else.
- **Tiles come from the network.** Maps uses [OpenFreeMap](https://openfreemap.org/) tiles by default. You can swap in other styles (including a separate dark-mode URL) under Settings → Maps, or self-host with Protomaps, but an offline laptop won't draw the background.
- **Blank map on first load** usually means an outdated installer. The help docs recommend updating the Obsidian installer, not just the app.

If you've been tracking places in a folder and scrolling to find them, start small. Tag ten notes, add coordinates, and build one map view. The [Map view help page](https://obsidian.md/help/bases/views/map) covers every setting, and the plugin's [example files](https://github.com/obsidianmd/obsidian-maps/tree/master/examples) are worth opening in a scratch vault to see icons and colors already wired up. Once the pins are there, you'll notice how many of your notes were really about a place all along.
