# Demo Video Template

A reusable Remotion 4 project for making product demo videos. Edit one file (`src/config.ts`) + drop in screenshots + voiceover, and you get a ready-to-render 5-act demo video. No code changes required for a new product.

> Two companion reads:
> - **`CLIENT-DEMO-PLAYBOOK.md`** — how to make any internal SaaS / B2B product safely demoable to clients (demo flag vs dev-bypass, "Try Demo" entry point, no empty states, idempotent seed, pre-demo checklist).
> - **`CHEATSHEET.md`** — running list of gotchas from prior videos (blurry screenshots, 429 rate limits, empty seed panels, VO/visual sync drift, music mix levels, etc.). Read before your first render if you want to skip the mistakes.
>
> See also: [**Optional Hyperframes integrations**](#optional-hyperframes-integrations) below — opt-in tooling for pre-render validation, lip-sync verification, and shader transitions between acts.

## Quick start

### Self-served (recommended) — just give the product repo URL

```bash
cd demo-video-template            # your clone of this repo
npm install
npm run new-video
#   → prompts for: product name, repo URL, logo path
#   → scaffolds $DEMO_VIDEOS_ROOT/<name>/ (default ~/demo-videos/<name>/) with brand colors pre-filled
#   → clones source-repo/ for PRD reading
#   → prints next step: invoke /new-video in Claude Code to do the creative work
```

Then in Claude Code (or any agent that auto-discovers `.agents/skills/`):
```
/new-video
```
The agent reads the PRD, writes the business story, captures screenshots per `SCREENSHOT.md`, generates VO, validates with `npm run doctor`, and renders. End-to-end pipeline.

### Manual (the underlying steps)

```bash
git clone <this-repo> my-product-demo
cd my-product-demo
npm install

# 1. Edit src/config.ts — set brand wordmark, tagline, problem lines, slide list
# 2. Drop screenshots into  public/screenshots/  (one per SLIDE entry)
# 3. Drop voiceover mp3s into public/voiceover/   (one per SLIDE entry)
# 4. Drop background music as public/audio/music.mp3 (optional)

npm run doctor   # validates config.ts against the hard rules in RULES.md
npm run start    # opens Remotion Studio to preview
npm run render   # writes out/demo-v1.mp4 (runs doctor first)
```

## What's in each file

```
.
├── src/
│   ├── config.ts                  ← EDIT THIS. Brand, palette, problem lines, slide list.
│   ├── types.ts                   ← Shared types (Slide, Phrase, Hotspot).
│   ├── constants.ts               ← Re-exports colors + canvas size. Don't usually touch.
│   ├── Root.tsx                   ← Remotion composition registration.
│   ├── TemplateComposition.tsx    ← Wires the 5-act sequence. Adjust act durations here if needed.
│   ├── scenes/
│   │   ├── ProblemScene.tsx       ← Renders PROBLEM_LINES from config.
│   │   ├── ShiftScene.tsx         ← Renders SHIFT_PUNCH from config.
│   │   ├── RevealScene.tsx        ← Renders BRAND.wordmark + tagline.
│   │   ├── ScreenshotMontage.tsx  ← Renders SLIDES with crossfade, kinetic phrases, camera zoom.
│   │   └── ClosingScene.tsx       ← Renders BRAND.closingHead / closingSub / closingPill.
│   └── components/                ← Optional helpers (interactive overlays, etc.).
├── public/
│   ├── screenshots/               ← Drop 1920×1080 PNGs here, names matching SLIDES[].img
│   ├── voiceover/                 ← Drop mp3s here, names matching SLIDES[].audio
│   └── audio/music.mp3            ← Optional background track (gitignored by default)
├── take-screenshots.py            ← Playwright capture script — adapt URL/selectors per product
├── gen-voiceover.py               ← ElevenLabs TTS pipeline (set ELEVENLABS_API_KEY)
├── package.json
└── remotion.config.ts
```

## The 5-act structure

Every demo video uses the same chassis. Don't fight it — fill it in.

| Act | What | Source | Default length |
|---|---|---|---|
| **1. Problem** | The pain. 2–3 short punch lines explaining what's broken today. | `PROBLEM_LINES` in config.ts | 12 s (360 f) |
| **2. Shift** | One short hook — "What if…?" | `SHIFT_PUNCH` in config.ts | 3 s (90 f) |
| **3. Reveal** | Wordmark + one-line tagline. | `BRAND.wordmark` + `BRAND.tagline` | 3 s (90 f) |
| **4. Montage** | Per-slide screenshot + step badge + kinetic phrases + voiceover. | `SLIDES` array in config.ts | sum of `SLIDES[i].duration` |
| **5. Closing** | Headline + sub + branded pill. | `BRAND.closingHead/Sub/Pill` | 5 s (150 f) |

To change a scene length: edit the `*_FRAMES` constants at the top of `TemplateComposition.tsx`.

## Slide grammar (what goes into each `SLIDES[i]` entry)

```ts
{
  step:     "1 · Operate",                   // Step badge text (top-left of the slide)
  img:      "01-dashboard.png",              // file in public/screenshots/
  audio:    "vo-dashboard.mp3",              // file in public/voiceover/
  duration: 255,                             // frames at 30 fps — match to VO length + small buffer
  flashes:  [215],                           // optional: brief flash overlays at these frames

  phrases: [                                 // Kinetic 1–3 word phrases shown over the screenshot
    { text: "Every incident.",  frame: 0,   size: 84 },
    { text: "SLA. MTTR.",       frame: 80,  size: 76 },
    { text: "Covered.",         frame: 215, color: "ACCENT", impact: true },
  ],

  hotspots: [                                // Camera pan + zoom targets (smooth springs between them)
    { frame: 0,   x: 50, y: 50, zoom: 1.00 },               // wide
    { frame: 30,  x: 50, y: 22, zoom: 1.06 },               // zoom up to header
    { frame: 95,  x: 32, y: 50, zoom: 1.05 },               // pan left
    { frame: 165, x: 70, y: 50, zoom: 1.05 },               // pan right
    { frame: 215, x: 50, y: 75, zoom: 1.10, punch: true },  // SLAM at bottom
  ],
}
```

## Hard rules (from prior iteration)

1. **Cover-fit screenshots** (`Math.max(CARD_W/iw, CARD_H/ih)`), top-aligned per image dimensions. Never crop the top, never show whitespace.
2. **At least 4 hotspots per slide** — wide → zoom in → pan → SLAM. Single-zoom slides feel static.
3. **Unique music per video.** Default mix knobs: `BASE_FLOOR=0.05, BASE_PEAK=0.10, PULSE_AMP=0.06, CAP=0.18`.
4. **Lip-sync.** Kinetic phrases are direct excerpts from the voiceover at that frame, not paraphrases.
5. **Brevity.** Each kinetic phrase 1–3 words. Hard cap 8 words per slide.
6. **5-act structure is fixed** — Problem → Shift → Reveal → Montage → Closing.
7. **Slide duration must match VO length** (e.g. a 7 s VO → ~210 frames + small buffer). Otherwise you get silent gaps or VO cut-off.

## Audio licensing

Background music (`public/audio/music.mp3`) is gitignored by default. Use royalty-free sources (CC0 or Pixabay). If your team has Epidemic Sound, use those tracks but never commit the mp3.

Voiceover mp3s are generated by `gen-voiceover.py` calling ElevenLabs — set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` (the voice to use; there is no default), then edit the `SCRIPTS` dict at the top of that file.

## Environment variables

| Variable | Used by | Default |
|---|---|---|
| `ELEVENLABS_API_KEY` | `gen-voiceover.py` | none (required) |
| `ELEVENLABS_VOICE_ID` | `gen-voiceover.py` | none (required) |
| `DEMO_VIDEOS_ROOT` | `npm run new-video` (where projects are created), `npm run pick-music` (music library at `$DEMO_VIDEOS_ROOT/_music-picks/`) | `~/demo-videos` |

## What's gitignored

- `node_modules/` — reinstall via `npm install`
- `out/*.mp4` — regenerate via `npm run render`
- `public/audio/music.mp3` — licensed third-party tracks
- `public/transitions/*.mp4` — regenerate via `npm run transition -- <name>`
- `public/voiceover/*.json` — regenerate via `npm run transcribe`
- `*.bak`, `.DS_Store`

---

## Optional Hyperframes integrations

The base 5-act render works without any of these. They're additive — opt in only when you want them. Inspired by / borrowed from [HeyGen's Hyperframes](https://github.com/heygen-com/hyperframes).

### 1. Pre-render validator — `npm run doctor`

Walks `src/config.ts` and fails loud if your hard rules are violated:

- Each slide has ≥4 hotspots (wide → zoom → pan → SLAM)
- Each slide has ≤8 words across all `phrases[].text`
- `SLIDES[i].duration` matches the VO mp3 length within ±15 frames
- Every `img` exists in `public/screenshots/` and is ≥1920×1080
- Every `audio` exists in `public/voiceover/`
- `BRAND` / `PROBLEM_LINES` / `SHIFT_PUNCH` set
- Warns if `public/audio/music.mp3` is missing

Runs automatically before `npm run render`. To skip: `npm run render:skip-doctor`.

### 2. Lip-sync verification — `npm run transcribe && npm run lip-sync`

`npm run transcribe` calls `hyperframes media transcribe` (Whisper) on every VO mp3, producing `public/voiceover/<name>.json` with word-level timestamps.

`npm run lip-sync` then walks `SLIDES[i].phrases` and verifies each phrase is actually spoken in the VO at `phrases[i].frame ± 15 frames`. Catches drift between visuals and voiceover before render — the most common iteration bug per `CHEATSHEET.md`.

### 3. Shader transitions between acts — `npm run transition`

Render a transparent-background shader transition (`flash-through-white`, `prism-shift`, `crt-cut`) as an mp4 in `public/transitions/`, then turn it on in `config.ts`:

```bash
npm run transition -- flash-through-white
```

```ts
// src/config.ts
export const ACT_TRANSITIONS = {
  shift:   "flash-through-white",
  reveal:  "prism-shift",
};
```

The transition plays as a 1s overlay at the start of that act. Acts you don't list keep the default crossfade.

### 4. Hyperframes-rendered slide videos (advanced)

For slides where a static screenshot isn't enough (animated chart, counter wipe, social overlay), render the clip in Hyperframes and set `video: 'foo.mp4'` on the slide. The Remotion render composites it via the existing `<Video>` pipeline.

### 5. Agent skills under `.agents/skills/`

`npx skills add heygen-com/hyperframes` installed 15 framework-specific skills (`gsap`, `hyperframes-media`, `tailwind`, `lottie`, etc.) plus a custom `demo-video` skill that encodes this repo's 5-act rules. Claude Code, Cursor, Codex, Gemini CLI, and others auto-discover them. Invoke `/demo-video` to author a new video — the agent will know your hard rules without re-explaining.
