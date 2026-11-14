# Cheatsheet — gotchas + fixes

A running list of issues that came up making the prior demo videos, and how to fix them when you hit the same wall.

## 1. Screenshots look blurry under zoom

**Cause:** Source PNGs are 1920×1080. The slide zooms 1.0×–1.5×; at 1.5× each rendered pixel is stretched.

**Fix:** Capture at 2× device-pixel-ratio. In `take-screenshots.py`:
```python
DEVICE_SCALE = 2
ctx = await p.chromium.launch_persistent_context(
    ...,
    device_scale_factor=DEVICE_SCALE,
)
```
Resulting PNGs are 3840×2160 — Remotion downscales cleanly at any zoom level.

---

## 2. Screenshots come out blank / showing the login page

**Cause:** The product's per-tenant rate limiter is returning 429 to Playwright's parallel requests. Your auth set in localStorage, but the API rejects the burst, the page shows the auth-required redirect, you screenshot the empty fallback.

**Fix:** Either bump your dev-mode rate limit to 2000 req/min, or flush the Redis (or equivalent) rate counters before the script runs:
```bash
redis-cli --scan --pattern 'rate:tenant:*' | xargs -r redis-cli del
```

---

## 3. One slide has empty regions / "No data" / "Not configured"

**Cause:** Your seed populates the *count* of a resource but not the *detail* fields (rotation buckets, portal users, etc.). The page renders an empty panel.

**Fix:** Audit your seed against every page the video visits. Add the missing fields. See `CLIENT-DEMO-PLAYBOOK.md` §3 "No empty states" for the common gaps.

Click-through trick: if your script lands on a list page, add a `post_action` to click a specific seeded row that has rich data — don't trust whichever row sorts first.

---

## 4. Voice-over and visuals fall out of sync

**Cause:** Slide durations don't match VO durations.

**Fix:** Use Whisper to get exact timestamps:
```bash
whisper public/voiceover/vo-slide-1.mp3 --model small --output_format srt
```
Then set each slide's `duration` in `src/config.ts` to match the VO length (in frames at 30 fps). A 7.2 s VO → 216 frames + 14-frame buffer = 230.

For per-word kinetic phrase timing, place `phrases[i].frame` at the start frame of each VO word/sentence from the srt.

---

## 5. Brief blank flash between slides

**Cause:** Each slide's exit fade ends 20 frames before the next slide's enter starts.

**Fix:** Already handled by `SLIDE_OVERLAP = 18` in `ScreenshotMontage.tsx` — overlapping the next slide's start by 18 frames creates a crossfade.

If you still see blanks, the slide durations may exceed the audio length. Trim duration to match VO + ~10-frame buffer.

---

## 6. Closing pill / brand text is wrong

**Cause:** You changed `BRAND` in `src/config.ts` but the scenes have stale hardcoded text.

**Fix:** All five scenes read from `BRAND` in config. If you find a hardcoded string in `scenes/*.tsx`, replace with `BRAND.<field>` from config. The template doesn't ship with any hardcoded brand strings — but if you forked from an example project, check.

---

## 7. Music doesn't suit the product

**Try these vibes:**
- **Cinematic tension w/ pulse** (Black Mirror / Mr. Robot intro) — fits incident-response, security, ops tools
- **Hopeful tech score** (Apple / Stripe product film) — fits consumer-facing tools, design tools
- **Driving synthwave** (Stranger Things) — fits dev tools, performance dashboards
- **Slow ambient cinematic** — fits healthcare, accounting, anything where calm-confidence matters

**Sources for royalty-free tracks:**
- [Internet Archive — Ambient Film Music (Serge Quadrado)](https://archive.org/details/ambientforfilm) — CC0
- [Internet Archive — Synthwave](https://archive.org/details/synthwave) — explicitly royalty-free, cyberpunk/synth
- Pixabay royalty-free music — commit-safe
- Epidemic Sound — paid, NEVER commit the mp3

Drop the chosen track at `public/audio/music.mp3` (gitignored). Add an `<Audio>` element in `TemplateComposition.tsx` if you want it playing under the whole video — set the `volume` prop low (around `0.08`–`0.15`) so it sits under the voiceover.

---

## 8. Music is too quiet / inaudible under voice-over

**Cause:** Default mix knobs are designed to sit *under* the VO. Floor 0.05, peak 0.10, cap 0.18.

**Fix:** For a more prominent music bed, bump to floor 0.14, peak 0.22, cap 0.34. Edit the `musicVolume(f)` function wherever you wire `<Audio src=".../music.mp3" volume={musicVolume}>`.

---

## 9. Local app gets wiped from disk repeatedly

This is rare but it bit us once: a local clone of a product app (`~/Desktop/<app>/`) got cleaned up by some background process. Lost ~5 hours of local-only changes.

**Fix:** Clone product apps under `~/Documents/`, not `~/Desktop/`. Whatever's running cleanup leaves Documents alone.

---

## 10. Chrome headless hangs or times out during render

**Cause:** Leftover headless-shell processes from a previous render or screenshot run.

**Fix:**
```bash
pkill -9 -f "chrome-headless-shell"
```
Then re-run `npm run render`. The Remotion CLI also supports `--timeout 120000` per-component if you have long-running expensive components.

---

## 11. Music license accident — track committed to git

If you accidentally committed a licensed mp3 (Epidemic Sound, etc.):
```bash
git rm --cached public/audio/music.mp3
echo "public/audio/music.mp3" >> .gitignore
git commit -am "Untrack licensed audio"
```
For history scrubbing: `git filter-repo --path public/audio/music.mp3 --invert-paths`. But better to never commit it in the first place — the template's `.gitignore` already excludes it.

---

## 12. Different product needs a different aspect ratio (mobile portrait)

The template defaults to 1920×1080 (landscape). For mobile-portrait product demos, you have two options:

**Option A — render the entire video in portrait:**
Edit `src/constants.ts`:
```ts
export const VIDEO_WIDTH  = 1080;
export const VIDEO_HEIGHT = 1920;
```
Adjust the kinetic-text font sizes and step-badge positions accordingly.

**Option B — keep landscape canvas, embed a phone mockup:**
Wrap each screenshot in a phone-shaped container (~940 px tall, ~434 px wide for 390×844 source) sitting on the right side of a 1920×1080 canvas, with text on the left.

---

## 13. Brand wordmark is unreadable on certain screens

If your wordmark uses a color that clashes with a brand-color screenshot header (e.g. orange logo on orange dashboard header), the logo disappears mid-zoom.

**Fix:** Use a contrast-aware logo. Either:
- Two SVG variants (light + dark) selected by a CSS variable
- A simple text wordmark instead of an image — works at any size, picks up the config color

The template uses text wordmark by default in `RevealScene.tsx`.

---

## 14. Pre-render checklist

Run through this before declaring a video done:

```
□ Every slide has data — no "No incidents yet" / "Not configured" cards
□ Every kinetic phrase is a direct excerpt from the VO at that frame
□ Each phrase is 1–3 words; hard cap 8 words per slide
□ Each slide has ≥4 hotspots (wide → zoom → pan → SLAM)
□ Each slide's duration matches its VO length + small buffer
□ No blank frame between slides (SLIDE_OVERLAP applied)
□ Music sits underneath the VO, not over it
□ Closing pill text matches the product name (not the template default)
□ The full video plays without "white frame" gaps when scrubbed in QuickTime
□ Open the rendered mp4 in iMovie or VLC and check audio levels at -16 LUFS
```
