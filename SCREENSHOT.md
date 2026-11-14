# SCREENSHOT.md — Generalized capture spec for demo-video projects

> One spec, every project. Drop a copy of this into each project folder, fill in the **Project Config** block, run `python3 take-screenshots.py`, and the screenshots needed by the project's video-brief.md will land in `public/screenshots/` at the exact filenames the Remotion code expects.

---

## Why this exists

Every project in `$DEMO_VIDEOS_ROOT/*` (default `~/demo-videos/*`) already has:
- `video-brief.md` — the story, the screen list, the captions
- `src/scenes/ScreenshotMontage.tsx` — the Remotion code that loads files like `01-foo.png`, `02-bar.png` from `public/screenshots/`
- `out/<project>-v1.mp4` — the last rendered video (some projects)

What's been ad-hoc until now is the **capture step** — each project hand-rolled its own Playwright script with slightly different conventions. This file is the canonical version.

---

## Project Config (fill this in per project)

```yaml
project: <slug>                         # e.g. casepilot, loopd, dropkit
base_url: <https://… or http://localhost:PORT>
viewport: {width: 1920, height: 1080}   # match VIDEO_WIDTH/HEIGHT in src/constants.ts

# REQUIRED. Which Try Demo button the script clicks on the product's login
# page. The target product MUST expose both `Try Demo · India` and
# `Try Demo · US` (template rule, see CLIENT-DEMO-PLAYBOOK.md §2). The script
# fails loud if the chosen locale's button isn't found — it refuses to fall
# back to real credentials or a generic "Try Demo" button, because either
# would risk capturing real customer data.
demo_locale: US                         # "IN" or "US"

# Pre-screenshot order (the /new-video skill enforces this):
#   1. Boot the product LOCALLY with DEMO_MODE=true + NEXT_PUBLIC_DEMO_MODE=true
#   2. Manually open /auth/login, click "Try Demo · <locale>", confirm dashboard loads with seeded data
#   3. Only then run `python3 take-screenshots.py`
# Skipping any of these gets you blurry/empty/PII-leaking captures.

# Legacy escape hatch — only for products that don't yet have Try Demo buttons.
# Should be removed once the target adds them per the playbook.
auth_mode: try-demo                     # try-demo (default) | form (legacy fallback)
auth_payload:                           # only used by auth_mode: form
  email: demo@example.com
  password: demo1234

shots:                                  # in story order — names MUST match SLIDES[].img in src/config.ts
  - file: 01-dashboard.png
    path: /dashboard
    wait_ms: 2000
    scroll_y: 0
  - file: 02-foo.png
    path: /foo
    wait_ms: 2500
    scroll_y: 0
```

The `shots` list comes straight from the project's `video-brief.md` "Screens" table — same filenames, same order.

---

## Capture rules (Rules.md compliance)

1. **Full viewport, not full page.** `full_page=False`. The video already crops with COVER-FIT — full-page screenshots break the top-anchor math.
2. **No scrollbars.** Add `overflow: hidden` to body before screenshot if a scrollbar shows.
3. **Mask real PII.** Never capture real customer names, phone numbers, emails. Demo data only.
4. **Wait for network idle, then sleep.** `wait_until="networkidle"` then `wait_for_timeout(wait_ms)` — covers lazy-loaded charts.
5. **Skip-if-exists.** Re-runs should not overwrite a good screenshot. Delete the file to recapture it.
6. **Brand chrome stays inside the screenshot.** Do NOT add any of your video-frame branding into the screenshot itself — that's the video frame's job.
7. **Audio–visual sync is non-negotiable.** The screenshot on screen at frame `N` must literally show whatever the VO is talking about at frame `N`. See the dedicated section below.

---

## Audio–visual sync (the lip-sync rule for screenshots)

**Rule.** Whatever the voiceover is *saying* at any given moment, the screenshot on screen must *show*. If the VO says "track the full funnel in real time," the visible screenshot at that moment must literally be the funnel — not the calendar, not the dashboard, not a 'close-enough' substitute.

This is **stricter** than RULES.md §4 (kinetic-phrase lip-sync). That one governs the 1–3 word overlay text. This one governs the underlying image. Both must be true at the same frame.

**How to enforce it during capture:**

1. **Read the VO script first.** Open `gen-voiceover.py` (or whichever script generates the VO mp3s) and the project's `video-brief.md`. For each montage slide, write down the exact VO sentence in a comment next to its filename.
2. **Match the screenshot to the VO claim, literally.** The screenshot must visually contain the thing the VO names:
    - VO: "live funnel" → screenshot shows the funnel chart, not a dashboard tile labelled "Funnel."
    - VO: "auto-regenerates the underperforming piece" → screenshot shows the AI-regenerate UI with the underperforming item highlighted, not just the content list.
    - VO: "approve in one tap" → screenshot shows the approval CTA visible above the fold.
3. **If the UI doesn't support the claim, change one of them.** Either re-shoot the screenshot on a screen that *does* show the claim, or rewrite the VO line for what the UI actually shows. Do not paper over the gap with a kinetic overlay.
4. **Same ordering, no shuffling.** Filenames `01-…` through `NN-…` must appear in the same order as VO mp3s `vo-…-01.mp3` through `vo-…-NN.mp3`. The montage timeline plays them paired.
5. **Length parity.** If the VO clip for slide 3 is 6 seconds, the slide-3 screenshot stays on screen for ~6 seconds. Use the VO duration to set montage slide durations in the Remotion composition — never set them by gut.

**Pre-render check (5 minutes, mandatory):**
- Open the final mp4 with audio at 0.5× speed.
- For each montage slide, freeze on the SLAM frame and ask: *if I muted the audio and showed only this frame, would a viewer understand what the VO claim is?*
- If no, that slide is not done. Either swap the screenshot or rewrite the VO.

---

## Filename convention

`NN-screen-state.png` — zero-padded, kebab-case.

- `NN` = 2-digit order matching the montage slide order in `video-brief.md`
- `screen` = the route/page (`dashboard`, `funnel`, `chat`)
- `state` = optional modifier (`empty`, `filled`, `open`)

Examples that pass: `01-dashboard.png`, `04-chat-open.png`, `02-onboarding-step-1.png`.

---

## The script (drop in as `take-screenshots.py`)

Each project gets its own `take-screenshots.py` based on this template. The only things that change per project are the four placeholders at the top: `BASE_URL`, `AUTH_MODE`, `AUTH_PAYLOAD`, `SHOTS`.

```python
"""
take-screenshots.py — capture screenshots for the demo video.

Usage:
    python3 take-screenshots.py            # captures all missing shots
    python3 take-screenshots.py --force    # recapture even if file exists
"""
import asyncio, json, sys, tempfile
from pathlib import Path
from playwright.async_api import async_playwright

# ── FILL IN PER PROJECT ────────────────────────────────────────────────
BASE_URL    = "http://localhost:3000"
AUTH_MODE   = "none"            # none | form | localstorage
AUTH_PAYLOAD = {}               # see below
VIEWPORT    = {"width": 1440, "height": 900}
SHOTS = [
    # (filename,              path,           wait_ms, scroll_y)
    ("01-dashboard.png",      "/dashboard",   2000,    0),
]
# ──────────────────────────────────────────────────────────────────────

OUT_DIR = Path(__file__).parent / "public" / "screenshots"
OUT_DIR.mkdir(parents=True, exist_ok=True)
FORCE = "--force" in sys.argv

async def seed_localstorage(ctx, payload):
    js = "; ".join(f"localStorage.setItem({json.dumps(k)}, {json.dumps(v)})"
                   for k, v in payload.items())
    await ctx.add_init_script(js)

async def login_form(page, payload):
    await page.locator('input[type=email], input[name=email]').first.fill(payload["email"])
    await page.locator('input[type=password], input[name=password]').first.fill(payload["password"])
    await page.locator('button[type=submit], button:has-text("Sign in"), button:has-text("Log in")').first.click()
    await page.wait_for_load_state("networkidle")

async def main():
    async with async_playwright() as p:
        tmp = tempfile.mkdtemp(prefix=f"shot_")
        ctx = await p.chromium.launch_persistent_context(
            user_data_dir=tmp, headless=True, viewport=VIEWPORT)
        if AUTH_MODE == "localstorage":
            await seed_localstorage(ctx, AUTH_PAYLOAD)
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()

        await page.goto(BASE_URL, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)

        if AUTH_MODE == "form":
            await login_form(page, AUTH_PAYLOAD)

        for fname, path, wait_ms, scroll_y in SHOTS:
            out = OUT_DIR / fname
            if out.exists() and not FORCE and out.stat().st_size > 50_000:
                print(f"  skip (exists): {fname}")
                continue
            url = BASE_URL + path
            print(f"  → {fname:32}  {url}")
            try:
                await page.goto(url, wait_until="networkidle", timeout=30_000)
            except Exception:
                await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
            await page.wait_for_timeout(wait_ms)
            if scroll_y:
                await page.evaluate(f"window.scrollTo({{top:{scroll_y}, behavior:'instant'}})")
                await page.wait_for_timeout(400)
            await page.screenshot(path=str(out), full_page=False)
            print(f"    ✓ saved ({out.stat().st_size // 1024} KB)")

        await ctx.close()
        print(f"\nDone. {len(SHOTS)} shots in {OUT_DIR}")

asyncio.run(main())
```

---

## Pre-flight checklist

Before running:
- [ ] Project's web app is reachable (local dev server up OR staging URL responds)
- [ ] Demo credentials exist and are seeded with realistic-but-fake data
- [ ] `playwright` is installed (`pip install playwright && playwright install chromium`)
- [ ] `public/screenshots/` is empty (or you actually want to skip the existing ones)

After running:
- [ ] All filenames in `video-brief.md`'s "Screens" table exist in `public/screenshots/`
- [ ] No screenshot is < 50 KB (means it captured an error page or blank state)
- [ ] No screenshot shows PII or a logged-in non-demo identity
- [ ] Open each in Preview — no scrollbar, no broken images, no dev banners

If all boxes pass, the video can be re-rendered with `npm run render`.
