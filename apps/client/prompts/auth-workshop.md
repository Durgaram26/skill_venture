---
id: auth-workshop
title: Auth aside — workshop atmosphere
status: deployed
site_placement: AuthLayout.tsx — left panel background
asset_path: public/images/auth-workshop.png
component: AuthLayout
layout: cover on dark aside; heavy gradient scrim over image
palette:
  background: "#06141F"
  ink: "#102A28"
  primary: "#0D7A6F"
  accent: "#D9773A"
  chalk: "#EEF3F1"
---

# Auth aside — workshop atmosphere

## Use on site

Background photo behind the dark left column on `/login` and `/register`.

## Layout note

Save as `apps/client/public/images/auth-workshop.png`. CSS uses `background-size: cover` + dark scrim — **no text in the image**. Subject weighted to the right; left third can be darker.

## Paste-ready prompt (ChatGPT / DALL·E / Flux)

```
Editorial photograph for a skill-marketplace auth page sidebar (courses, bootcamps, hackathons in India).
Scene: close-up of a late-evening workshop desk — open notebook with faint sketches, laptop edge with soft teal screen glow, copper desk lamp, a perforated paper admission ticket stub lying flat, small circuit board and pencil — no faces, no people.
Style: cinematic editorial, quiet and trustworthy, soft grain, shallow depth of field.
Palette only: deep void shadows #06141F, forest ink #102A28, teal lamp glow #0D7A6F and #2BB5A5, copper accents #D9773A, cool mint paper #EEF3F1.
Composition: portrait or 4:5 vertical preferred (or 3:4), subject weighted to the RIGHT half, LEFT third darker and calmer for logo/copy overlay on the website.
No text, no logos, no watermarks, no handshakes, no classroom whiteboards with writing, no stock “diverse team” poses.
High quality PNG, 1200×1600 or 1080×1440.
```

## After export

1. Generate in ChatGPT
2. Download PNG
3. Save/replace: `apps/client/public/images/auth-workshop.png`
4. Hard-refresh `/register` — image appears under the dark scrim on the left
5. Update this file `status: deployed` when done
