# Video placeholders

Drop the real footage in here using these exact filenames — the Interactive
Screens page (`/interactive-screens`) already references both paths, so
nothing else needs to change once the files land.

- `interactive-screens-hero.mp4` — full-bleed background video for the page
  hero. Muted + looping, so no audio track is needed. Something showing the
  screen in active use (a hand touching it, a class or meeting in progress)
  reads best. Keep it short (10-20s) and compressed — it autoplays on page
  load, so file size directly affects load time.
- `interactive-screens-demo.mp4` — the full product walkthrough shown in the
  "See it in action" section. This one has visible play/mute controls, so an
  audio track (narration, room sound) is expected.

Until these exist, both sections fall back to a static gradient with a
"TODO: placeholder video" badge instead of a broken video element.
