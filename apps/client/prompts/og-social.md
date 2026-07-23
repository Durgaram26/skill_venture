---
id: og-social
title: Open Graph share card
status: planned
site_placement: meta og:image
asset_path: public/images/og-skillventures.png
layout: 1200×630 center-safe
palette:
  background: "#06141F"
  ink: "#102A28"
  primary: "#0D7A6F"
  accent: "#D9773A"
---

# Open Graph share card

## Use on site

Social preview when links are shared (set via meta / SSR later).

## Layout note

Center-safe; leave a quiet band for optional title overlay in code — **do not** bake “SkillVentures” text into the image if you prefer HTML OG title.

## Paste-ready prompt

```
Open Graph social image for SkillVentures skill-discovery marketplace.
Scene: abstract editorial composition — perforated admission ticket silhouette overlapping a soft workshop desk still-life (notebook edge, teal lamp glow), cinematic and minimal.
Style: refined editorial, trustworthy, not stocky.
Palette: void #06141F, ink #102A28, teal #0D7A6F, copper #D9773A, chalk #EEF3F1 only.
Composition: 1200×630 landscape, center-safe subject, calm margins, no dense detail at edges.
No text, no logos, no watermarks, no handshakes.
```

## After export

- [ ] 1200×630 PNG to `public/images/og-skillventures.png`
- [ ] Wire `<meta property="og:image">`
