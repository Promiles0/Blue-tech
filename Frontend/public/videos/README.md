# Video placeholders

- `interactive-screens-hero.mp4` — full-bleed background video for the page
  hero. Muted + looping, so no audio track is needed. Something showing the
  screen in active use (a hand touching it, a class or meeting in progress)
  reads best. Keep it short (10-20s) and compressed — it autoplays on page
  load, so file size directly affects load time. Small enough (~22MB) to
  commit directly here — drop it in with this exact filename.
- `interactive-screens-demo.mp4` — the full product walkthrough shown in the
  "See it in action" section. This one has visible play/mute controls, so an
  audio track (narration, room sound) is expected.

Until these exist, both sections fall back to a static gradient with a
"TODO: placeholder video" badge instead of a broken video element.

## The demo video is NOT committed to git

`interactive-screens-demo.mp4` is ~140MB, over GitHub's 100MB file limit, so
it's gitignored (see `.gitignore`) instead of living in this folder in git.
[InteractiveScreensDemo.jsx](../../src/components/site/InteractiveScreensDemo.jsx)
loads it from Supabase Storage instead:

1. In the Supabase dashboard for this project, go to **Storage** and create a
   **public** bucket named `media` (skip this step if it already exists).
2. Upload the file into that bucket with the exact path
   `interactive-screens-demo.mp4` (root of the bucket).
3. That's it — the component builds the URL from `VITE_SUPABASE_URL`
   automatically: `<VITE_SUPABASE_URL>/storage/v1/object/public/media/interactive-screens-demo.mp4`.

To use a different host (Cloudinary, S3, YouTube, etc.) instead, set
`VITE_INTERACTIVE_DEMO_VIDEO_URL` to the full public URL and it takes
precedence over the Supabase Storage path.

For local development, you can still drop the file at
`Frontend/public/videos/interactive-screens-demo.mp4` (it's gitignored, so it
won't get committed) and set `VITE_INTERACTIVE_DEMO_VIDEO_URL=/videos/interactive-screens-demo.mp4`
in `.env.local` to use it instead of hitting Supabase.
