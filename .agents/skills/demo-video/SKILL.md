---
name: demo-video
description: Author a new product demo video using this Remotion template's 5-act chassis. Use when the user asks to make a demo video, draft a new video from screenshots, fill in config.ts, or scaffold a new product folder. Encodes the hard rules (cover-fit, hotspots, lip-sync, ≤8 words/slide, unique music, 5-act structure) so output is correct first try.
---

# Demo Video Authoring Skill

This skill loads when the user wants to make a new product demo video on this template. It encodes the rules that the repo's `README.md`, `CHEATSHEET.md`, and `CLIENT-DEMO-PLAYBOOK.md` describe. Read those three files in order if you have not already — they are the source of truth.

## The 5-act chassis (fixed — never reorder)

| Act | Source in `src/config.ts` | Default frames @30fps |
|---|---|---|
| 1. Problem | `PROBLEM_LINES` | 360 (12s) |
| 2. Shift   | `SHIFT_PUNCH`   | 90 (3s) |
| 3. Reveal  | `BRAND.wordmark` + `BRAND.tagline` | 90 (3s) |
| 4. Montage | `SLIDES[]` | sum of `SLIDES[i].duration` |
| 5. Closing | `BRAND.closingHead/Sub/Pill` | 150 (5s) |

To change act lengths, edit the `*_FRAMES` constants at the top of `src/TemplateComposition.tsx`. Never reorder.

## Hard rules (the doctor enforces these — read `scripts/doctor.ts`)

1. **Cover-fit screenshots.** Never crop the top. Never show whitespace. Top-aligned `Math.max(CARD_W/iw, CARD_H/ih)`.
2. **≥4 hotspots per slide.** Pattern: wide → zoom in → pan → SLAM. Single-zoom slides feel static.
3. **Unique music per video.** Defaults: `BASE_FLOOR=0.05, BASE_PEAK=0.10, PULSE_AMP=0.06, CAP=0.18`. Never reuse a track across products.
4. **Lip-sync.** Every `phrases[].text` must be a direct excerpt from the voiceover at that frame — not a paraphrase. Run `npm run lip-sync` to verify.
5. **Brevity.** Each kinetic phrase 1–3 words. Hard cap 8 words per slide across all phrases.
6. **Slide duration ≈ VO length.** A 7s VO → ~210 frames + 30-frame buffer. Mismatch = silent gap or VO cut-off.
7. **5-act structure is fixed.** Problem → Shift → Reveal → Montage → Closing. Do not invent new acts.

## Workflow for a new video

```bash
# 1. Scaffold a new folder by copying _template
cp -r <path-to-this-template> "${DEMO_VIDEOS_ROOT:-$HOME/demo-videos}/<product>"
cd "${DEMO_VIDEOS_ROOT:-$HOME/demo-videos}/<product>"

# 2. Capture screenshots — adapt URL/selectors in take-screenshots.py
python take-screenshots.py

# 3. Generate VO — set ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID, edit SCRIPTS dict
python gen-voiceover.py
#  (or, for fast drafts, use the Hyperframes Kokoro CLI:)
npx -p @hyperframes/cli hyperframes media tts --text "..." --out vo.mp3 --engine kokoro

# 4. Fill src/config.ts — brand, PROBLEM_LINES, SHIFT_PUNCH, SLIDES[]
# 5. Validate before render — catches 80% of gotchas
npm run doctor
npm run lip-sync

# 6. Preview / render
npm run start    # Remotion Studio
npm run render   # writes out/demo-v1.mp4
```

## Per-slide grammar (what to write in `SLIDES[i]`)

```ts
{
  step:     "1 · Operate",          // top-left badge — keep "<n> · <Verb>" format
  img:      "01-dashboard.png",     // in public/screenshots/
  audio:    "vo-dashboard.mp3",     // in public/voiceover/
  duration: 255,                    // frames @30fps — match VO length + ~30f buffer
  flashes:  [215],                  // optional flash overlays at these frames

  phrases: [                         // ≤8 words TOTAL across all phrases
    { text: "Every incident.",  frame: 0,   size: 84 },
    { text: "SLA. MTTR.",       frame: 80,  size: 76 },
    { text: "Covered.",         frame: 215, color: "ACCENT", impact: true },
  ],

  hotspots: [                        // ≥4 entries — wide → zoom → pan → SLAM
    { frame: 0,   x: 50, y: 50, zoom: 1.00 },
    { frame: 30,  x: 50, y: 22, zoom: 1.06 },
    { frame: 95,  x: 32, y: 50, zoom: 1.05 },
    { frame: 165, x: 70, y: 50, zoom: 1.05 },
    { frame: 215, x: 50, y: 75, zoom: 1.10, punch: true },
  ],

  // Optional (Hyperframes integrations, see README "Optional integrations"):
  // transitionIn: 'flash-through-white',   // shader transition before this slide
  // video: '02-chart.mp4',                  // play a Hyperframes-rendered clip instead of img
}
```

## Optional Hyperframes integrations

This repo ships extra capabilities from Hyperframes. They are opt-in — the base 5-act render works without them.

- **`scripts/transcribe-vo.ts`** — Whisper timestamps for every VO mp3 → `public/voiceover/*.json`. Feeds `lip-sync-check.ts` and future auto-captions.
- **`scripts/lip-sync-check.ts`** — verifies every `phrases[].text` is actually spoken at `phrases[].frame ± 5f`.
- **`scripts/make-transition.ts`** — renders a transparent-bg shader transition (e.g. `flash-through-white`) as an mp4 in `public/transitions/`. Reference from a slide via `transitionIn: 'flash-through-white'`.
- **`.agents/skills/hyperframes-media/`** — reference docs for the Kokoro TTS / Whisper transcribe / u2net background-removal CLIs.
- **`.agents/skills/gsap/`** — frame-accurate GSAP patterns for Remotion scenes that need richer animation.

## When NOT to use this template

- Vertical / TikTok-style hook videos (this template is 1920×1080 only)
- One-off cinematic pieces without the 5-act structure
- Products that need >8 slides (montage gets exhausting)
