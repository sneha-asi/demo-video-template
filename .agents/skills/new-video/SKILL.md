---
name: new-video
description: Drive the end-to-end demo-video pipeline once `npm run new-video` has scaffolded a folder. Use this skill when the user says "make a demo video for <product>", points at a freshly scaffolded $DEMO_VIDEOS_ROOT/<name>/ (default ~/demo-videos/<name>/), or asks you to "do the rest" after running new-video. Encodes the full creative workflow: read PRD → write business story → pick screens → run take-screenshots → generate VO → fill config.ts → doctor/lip-sync/render.
---

# new-video — End-to-end demo-video skill

This skill activates AFTER `npm run new-video` has scaffolded a folder. The mechanical bits (clone repo, copy logo, set brand colors) are done by that CLI. Your job is the creative work the CLI deliberately left to you.

## Entry checklist

Before doing anything, confirm:

1. You are inside `$DEMO_VIDEOS_ROOT/<name>/` (default `~/demo-videos/<name>/`). If not, ask the user to `cd` there.
2. `source-repo/` exists (the target product's code, freshly cloned).
3. `public/brand/logo.png` exists.
4. `src/config.ts` has the brand wordmark + COLORS filled, but `PROBLEM_LINES`, `SHIFT_PUNCH`, and `SLIDES[]` are still placeholder.
5. `RULES.md`, `SCREENSHOT.md`, and `DESIGN.md` are in the folder root.

If anything is missing, stop and ask the user to re-run `npm run new-video`.

## The 9-step pipeline

### Step 1 — Read the PRD

Look inside `source-repo/` for, in order:
- `PRD.md` / `prd.md` / `docs/PRD.md`
- `README.md` (top of repo)
- `docs/*.md` (skim filenames; read the 2–3 most relevant)
- `package.json` `description` field + scripts (clues about features)
- Any `*.feature` BDD files

Write a 5–8 line summary in your head (or in a scratchpad markdown) covering:
- What the product does (one sentence)
- Who uses it
- The 2–3 pains it removes
- The 2–3 capabilities that are the demo's "wow"

### Step 2 — Write the business story

Draft the 5-act narrative into `src/config.ts` directly. Follow `RULES.md` and the in-file comments.

**Act 1 — `PROBLEM_LINES`** (3 entries, ~4s each):
- Each is `{ lead?: string, punch: string }`.
- The pain you identified in step 1, in the user's voice.
- The 3rd line's punch should be the most visceral; set `punchColor: "ACCENT_DEEP"`.

**Act 2 — `SHIFT_PUNCH`** (one short hook, ≤8 words):
- Format: "What if [the magic]?" — 1 sentence.

**Act 3 — Reveal:**
- No change needed — `BRAND.wordmark` + `BRAND.tagline` already set by the CLI.
- Confirm `BRAND.tagline` is filled. If empty, write a 1-line tagline based on the PRD.

**Act 4 — `SLIDES[]`** (4–6 slides, each ~6–8s):
- One slide per "wow" capability from step 1.
- Each slide:
  - `step: "N · Verb"` — e.g. `"3 · Approve"`. Number matches montage order.
  - `img: "0N-<screen>.png"` — name now; you'll capture in step 4.
  - `audio: "vo-slide-N.mp3"` — name now; you'll generate in step 5.
  - `duration` — leave at 240 frames placeholder. You'll tune in step 5.
  - `phrases[]` — 2–3 entries, ≤8 words total. Direct excerpts from the VO you're about to write.
  - `hotspots[]` — 4 entries (wide → push → pull → SLAM). See RULES.md §2.
- Cross-check: each `phrases[i].text` must be ≤3 words. Total per slide ≤8 words.

**Act 5 — Closing:**
- `BRAND.closingHead`, `closingSub`, `closingPill` — write 1 punchy line each. The CLI set `closingPill` to `"<Name>."` already; confirm or override.

### Step 3 — Confirm the screen list with the user

Before screenshotting, print the slide list back to the user:

```
Slide  Screen                  VO claim                         SLAM phrase
1      <route>                 "<vo sentence>"                  "<phrase>"
2      <route>                 "<vo sentence>"                  "<phrase>"
…
```

Ask: "Does this story land, or do you want me to reshuffle?" Wait for confirmation. Story is the most expensive thing to fix later — do not skip this gate.

### Step 4 — Verify Try Demo · India + Try Demo · US buttons exist (mandatory gate)

**You may not proceed to screenshots until both buttons exist in the target product's source.** Why: without them, screenshots either need real credentials (PII risk) or land on empty-state screens. Both kill the video.

```bash
# Inside the project folder, search the cloned source repo:
grep -ril 'Try Demo · India\|tryDemo.*IN\|demo_locale=IN' source-repo/
grep -ril 'Try Demo · US\|tryDemo.*US\|demo_locale=US' source-repo/
```

If **both** greps return matches → continue to Step 5.

If **either** returns nothing → STOP. You have two paths:

**Path A — Add the buttons to the target product (recommended for products you own).**
Open the target product's login/signin page (most likely `source-repo/**/auth/login/page.tsx` or equivalent). Follow CLIENT-DEMO-PLAYBOOK.md §2 (Try Demo entry points). At minimum:
- Add two buttons on the signin UI: "Try Demo · India" and "Try Demo · US"
- Implement (or stub) the `/api/demo/seed?locale=IN|US` endpoint
- The seed must populate every screen your montage will visit (no empty states — see §3 of the playbook)
- India seed = INR pricing, +91 numbers, Indian names/cities; US seed = USD, +1 numbers, US names/cities
- Set a `demo_locale` cookie so cosmetic switches work
- Test locally: hit /auth/login → click both buttons → both land on /dashboard with seeded data

After adding, open a PR on the target product before continuing. Wait for merge + deploy before screenshotting production.

**Path B — Use a temporary local mock (only if the product is read-only-mockable).**
If you can't modify the target product's code (third-party app, not your team's repo, etc.), boot the product locally with a Playwright route interceptor that returns mock JSON on `/api/**`. Document this clearly — these screenshots are demo-only fakes, not production captures.

**Path C — Defer the video.**
Tell the user the target product isn't demo-ready and the video needs to wait until Try Demo buttons exist. Don't fake it with placeholder PNGs — that produces a video that doesn't match anything real.

### Step 5 — Capture screenshots

**Order matters. Do not skip steps.**

#### 5a. Boot the product LOCALLY

The pipeline forbids screenshotting against logged-in real data. Always run the product on `http://localhost:<port>` with `DEMO_MODE=true` and `NEXT_PUBLIC_DEMO_MODE=true` set in env. Typical pattern for a Next.js target:

```bash
cd source-repo/<frontend-package>     # e.g. source-repo/nudesk-web
DEMO_MODE=true NEXT_PUBLIC_DEMO_MODE=true npm run dev
# leave running in a separate terminal; confirm http://localhost:3000 loads
```

If the product has a backend (Spring Boot, etc.), boot that too — confirm `/api/demo/seed?locale=IN` and `/api/demo/seed?locale=US` both return 200 with `curl` before continuing.

#### 5b. Confirm the locale-specific button works manually

Open `http://localhost:3000/auth/login` (or the product's equivalent) in a browser. Click **Try Demo · US** (or **India** — your choice for this video). Confirm:
- You land on `/dashboard` (or wherever the product's first authenticated page is)
- The dashboard shows seeded data, not empty states
- The user/workspace name reflects the locale (US-flavored or India-flavored)

If this manual check fails, the screenshot script will fail too. Fix the product first.

#### 5c. Configure `take-screenshots.py`

Edit two things at the top of the file:

```python
BASE_URL    = "http://localhost:3000"   # where the product boots
DEMO_LOCALE = "US"                       # or "IN" — must match a button on the login page
```

Then fill in `SHOTS` per `SCREENSHOT.md` — one entry per slide in `src/config.ts SLIDES[]`:

```python
SHOTS = [
    ("01-onboarding-magic-moment.png", "/onboarding",       3000, "Step 2 of onboarding"),
    ("02-call-in-progress.png",        "/leads",            3000, "Live call view"),
    # ... etc, one per slide
]
```

The script will fail loud if the locale-specific Try Demo button isn't found — that's intentional. It refuses to fall back to real credentials.

#### 5d. Run

```bash
python3 take-screenshots.py
```

It will:
1. Open Chromium headless at `BASE_URL/auth/login`
2. Click `Try Demo · <DEMO_LOCALE>`
3. Verify navigation away from /login
4. Visit every route in `SHOTS` and save 1920×1080 PNGs to `public/screenshots/`

Per `SCREENSHOT.md`: never crop the top, never show whitespace, no real PII. The doctor will verify all the files exist + are ≥1920×1080.

#### 5e. Eyeball each screenshot

After capture, open `public/screenshots/` in Finder and look at every PNG. For each one, ask: "does this image visually show what the VO claims at that moment?" If a slide's VO says "books meetings" but the screenshot shows the dashboard, re-shoot that slide on a screen that actually shows the meeting booker. Per `SCREENSHOT.md` §"Audio-visual sync" — the underlying image must show what's spoken, not just an adjacent screen.

### Step 6 — Generate voiceover

Set the `ELEVENLABS_VOICE_ID` env var (pick from the ElevenLabs voices available to your account), then open `gen-voiceover.py` and fill the `SCRIPTS` dict:

```python
SCRIPTS = {
  "vo-shift.mp3":    "What if AI did the heavy lifting?",
  "vo-slide-1.mp3":  "<the actual sentence you wrote in Act 4>",
  "vo-slide-2.mp3":  "<…>",
  …
  "vo-closing.mp3":  "<closing line>",
}
```

Run:
```bash
python3 gen-voiceover.py
```

After generation, run:
```bash
npm run transcribe
```

This gives you word-level timestamps per VO mp3 (Whisper). Use them to:
- Set each `SLIDES[i].duration` = `round(VO_seconds * 30) + 30` (small buffer)
- Set each `phrases[i].frame` = the actual spoken-word timestamp × 30

### Step 7 — Pick music (local library or Pixabay fallback)

```bash
npm run pick-music
```

What this does:
1. Reads `src/config.ts` to infer the project's mood from BRAND.tagline + PROBLEM_LINES + SHIFT_PUNCH (keyword scoring: marketing / cyberpunk / fashion / people / cinematic / ambient).
2. Scans `$DEMO_VIDEOS_ROOT/_music-picks/` for tracks whose filename starts with that mood prefix.
3. Reads `_music-picks/_usage.json` and picks the LEAST-USED matching track.
4. Copies it to `public/audio/music.mp3` and logs the new assignment.
5. Falls back to scraping Pixabay Music via Playwright only if the local library has no matching unused track.

Override the inferred mood: `npm run pick-music -- --mood=cyberpunk`
Force re-pick (replace existing music.mp3): `npm run pick-music -- --force`

Rule from RULES.md §3: **never reuse a track across videos**. The usage log enforces this — if every matching track is exhausted, the script falls back to Pixabay to download a new one.

### Step 8 — Validate before render

```bash
npm run doctor       # hard-rule check (hotspots, words, dims, durations)
npm run lip-sync     # phrases land on real spoken words ±15f
```

Fix every error. Doctor and lip-sync are the difference between "ship it" and "render then notice the bug at 0:23".

### Step 9 — Render

```bash
npm run start    # Remotion Studio preview (optional, for sanity check)
npm run render   # writes out/demo-v1.mp4
```

If you want shader transitions between acts (Hyperframes integration), before render:
```bash
npm run transition -- flash-through-white
# then in src/config.ts:
export const ACT_TRANSITIONS = { shift: "flash-through-white", … };
```

## Hard rules you must enforce (RULES.md)

1. **Cover-fit screenshots** — never crop top, never whitespace
2. **≥4 hotspots per slide** — wide → zoom → pan → SLAM
3. **Unique music per video** — `public/audio/music.mp3` is gitignored; pick a track that hasn't been used by another folder in `$DEMO_VIDEOS_ROOT/`
4. **Lip-sync** — every kinetic phrase is a verbatim excerpt from the VO
5. **Brevity** — ≤3 words per phrase, ≤8 words per slide
6. **5-act structure is fixed** — never invent a 6th act
7. **Slide duration ≈ VO length** — within ±15 frames

The doctor enforces 1, 2, 5, 6 mechanically. The lip-sync checker enforces 4. You are the only enforcer of 3 (unique music) and 7 (story coherence).

## When to break out of the chassis

You should NOT use this skill for:
- Vertical / TikTok-style hook videos (template is 1920×1080)
- Videos longer than ~90 seconds (montage gets exhausting past 6 slides)
- Internal training videos (use a different template — this one is sales-flavored)

If the user is asking for any of the above, stop and ask whether they want to make a non-standard video instead.

## After the render

When `out/demo-v1.mp4` exists:
1. Tell the user the path.
2. Suggest they open it at 0.5× speed and freeze on each SLAM frame (the manual sync check from SCREENSHOT.md).
3. If they want changes, identify the smallest unit: a single `phrases[i].text` re-word, one screenshot recapture, one hotspot tweak. Avoid full re-renders of the chassis unless the story itself broke.
