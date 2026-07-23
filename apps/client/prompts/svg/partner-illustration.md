---
id: partner-illustration
title: Partner / how-it-works isometric
status: deployed
site_placement: HomePage.tsx — How it works right column
asset_path: public/images/partner-illustration.png
component: HomePage
layout: split right; object-contain; max-h-56
palette:
  background: "#EEF3F1"
  ink: "#102A28"
  primary: "#0D7A6F"
  accent: "#D9773A"
  white: "#ffffff"
animation: none
figma_notes: Vectorize PNG → simplify paths → delete background → export SVG to src/assets/illustrations/partner.svg
---

# Partner / how-it-works isometric

## Use on site

Right column beside “One enquiry. A clear pipeline.” on the home page.

## Layout note

Subjects left/center; empty right third unused (copy is beside the image in CSS). Prefer `object-contain`. No dual-frame SVG swap.

## Paste-ready prompt

```
Isometric flat vector illustration for a skill-marketplace website feature section.
Scene: friendly guide character beside a learner with a laptop; simplified device frame as a geometric prop; small ticket-stub, document, and gear icons as flat outline shapes (admission-pass motif).
Style: clean isometric vector art, solid color fills, crisp edges, no gradients or texture, no photorealism.
Palette: background #EEF3F1 solid fill, primary #0D7A6F, accent #D9773A, ink #102A28 for outlines, white highlights — maximum 6 colors total.
Composition: characters and props on left two-thirds, large empty calm area on the right third for optional overlay.
No text, no speech bubbles, no watermarks, no logos.
Square 1024×1024, high contrast edges, SVG-trace friendly for Figma.
```

## After export

- [ ] PNG generated at 1024×1024
- [ ] Traced in Figma; background removed
- [ ] Save raster to `public/images/partner-illustration.png` (interim) or SVG to `src/assets/illustrations/partner.svg`
- [ ] Status → deployed; append to done-prompts.md
