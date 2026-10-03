# Hyperframes Composition Brief: Blue-tech

## Objective
Create a short launch-style brag video for Blue-tech, a laptop store in Rwanda.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 21.3s

## Source Material
- Project root: `C:\Users\arois\Blue-tech`
- Primary files read: `Frontend/index.html`, `Frontend/src/index.css`, `Frontend/src/lib/promoSlides.js`, `Frontend/src/pages/HomePage.jsx`, `Frontend/src/pages/CheckoutPage.jsx`, `Frontend/src/context/CurrencyContext.jsx`, `README.md`
- Product name: Blue-tech
- Tagline / strongest claim: "Considered objects." / "Built to last — laptops chosen with care, not just specs."
- Key UI or visual moment to recreate: the MoMo checkout (select MTN Mobile Money, type phone, prompt sent, Order Confirmed)
- Copy that must appear verbatim:
  - Considered objects.
  - Built to last — laptops chosen with care, not just specs.
  - Built for the frame rate. / Work that keeps up with you. / Back to class, sorted. / Trade up, not down.
  - A payment prompt has been sent to
  - Order Confirmed

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film for a Kigali laptop shop
- Interpretation: long holds, soft crossfades and slides, and restrained sound
- Angle: Blue-tech sells laptops "chosen with care". The video follows the last mile, from a price in RWF to a mobile-money prompt to "Order Confirmed".
- Hook: "Considered objects." sets in word by word on black
- Outro / punchline: "Order Confirmed" lands on the 16.38s beat, then the Blue-tech mark and "Card · MTN MoMo · Airtel Money"
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign
  - Inventing product names, specs or prices beyond the labelled example price

## Visual Identity
- Background: `#0a0a0a`, surface `#141414`
- Text: `#ffffff`, secondary `#aaaaaa`
- Accent: `#354380`, `#5a73b0`, price `#f59e0b`, success `#22c55e`
- Display font: Space Grotesk
- Body font: Inter
- Visual references from the project: promo gradients from `promoSlides.js`, the dark H1, the price amber, the `logo-mark.svg` wordmark (copied to `assets/img/`)

## Storyboard
Use the storyboard in `brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 3.3s — "Considered objects." and the tagline
2. The shelf — 5.4s — four promo cards arrive one by one
3. Priced in RWF — 3.3s — the USD/RWF toggle and a $1,000 → 1,471,000 RWF count-up
4. The MoMo prompt — 5.5s — click, typed number, prompt sent, approve, Order Confirmed at 17.47s
5. Outro — 3.8s — logo, line, fade

## Audio
- Audio role: sparse professional accents
- Audio arc: a calm bed, then card sounds, a switch click, typing ticks, and one soft bell on Order Confirmed
- Music: `assets/music/bed.mp3` (vol-12 copy)
- Music treatment: volume about 0.28, short fade-in, fade-out over the last 2s
- Music cue guidance: bundled preset `vol-12` (~110 BPM). Strong cues used: 8.74s and 17.47s. Beat grid used for the card arrivals.
- Audio-reactive treatment: subtle; a brand-blue glow breathes with RMS
- SFX: files chosen after animation and copied to `assets/sfx/`

## Hyperframes Instructions
Requirements: show real project copy, keep text readable, stay within 15-25s, include the music/SFX layer, run `hyperframes check` before render.
