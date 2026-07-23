---
id: empty-listings
title: Empty explore state — blank ticket board
status: planned
site_placement: ListingsPage.tsx — empty filter results
asset_path: src/assets/illustrations/empty-listings.svg
component: ListingsPage
layout: centered max-w-sm object-contain
palette:
  background: "#EEF3F1"
  ink: "#102A28"
  primary: "#0D7A6F"
  accent: "#D9773A"
  white: "#ffffff"
animation: none
figma_notes: Trace → SVG; add “No exact matches” copy in React, not in image
---

# Empty explore state

## Use on site

Empty state when filters return zero programs.

## Layout note

Calm centered illustration; copy and “Show all programs” CTA live in React below.

## Paste-ready prompt

```
Isometric flat vector illustration for an empty-state on a course discovery website.
Scene: a cork notice board with three blank perforated admission tickets hanging from clips; one ticket slightly askew; a small copper pushpin and a teal stamp pad as props.
Style: modern SaaS flat vector, clean geometric shapes, crisp outlines, solid fills only — no gradients, no grain, no photorealism.
Palette: background #EEF3F1, primary #0D7A6F, accent #D9773A, ink #102A28, white — 6 colors max.
Composition: board centered, generous empty margin; no text on tickets.
No text, no speech bubbles, no watermarks, no logos.
1024×1024, SVG-trace friendly.
```

## After export

- [ ] PNG → Figma vectorize
- [ ] SVG to `src/assets/illustrations/empty-listings.svg`
- [ ] Wire into ListingsPage empty state
- [ ] Status → deployed
