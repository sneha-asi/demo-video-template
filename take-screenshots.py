"""
take-screenshots.py — capture product screenshots for the demo video.

Generic template. Edit:
  1. BASE_URL              — where your product runs locally
  2. AUTH section (login)  — how the script signs in (Try Demo button is cleanest)
  3. SHOTS list            — (filename, path, wait_ms, caption)
  4. Any per-shot prep     — click before screenshot, fetch a dynamic id, etc.

Run:  python3 take-screenshots.py [--force]

Prereqs:
  pip install playwright
  playwright install chromium

Tip: the rendered video pulls from public/screenshots/, so output filenames
must match the `img` values in src/config.ts SLIDES[].
"""
import asyncio, sys, tempfile
from pathlib import Path
from playwright.async_api import async_playwright

# ── Edit these ─────────────────────────────────────────────────────────────
# 1. BASE_URL — where the product is reachable. Boot the product LOCALLY
#    before running this script (e.g. `npm run dev` on the target's web app).
#    Use a hosted URL only if it has DEMO_MODE=true and the Try Demo buttons
#    exposed — the template forbids capturing against logged-in real data.
BASE_URL = "http://localhost:3000"

# 2. DEMO_LOCALE — which Try Demo button to click. Must be "IN" or "US".
#    The target product MUST expose Try Demo · India + Try Demo · US (template
#    rule, see CLIENT-DEMO-PLAYBOOK.md §2). This script will FAIL LOUD if the
#    chosen locale's button isn't on the login page.
DEMO_LOCALE  = "US"                           # "IN" or "US"

OUT_DIR  = Path(__file__).parent / "public" / "screenshots"

VIEWPORT = {"width": 1920, "height": 1080}   # match VIDEO_WIDTH/HEIGHT in constants.ts
DEVICE_SCALE = 2                              # 2x DPR — keeps screenshots crisp under zoom

# (filename, route, post-navigate wait in ms, caption)
SHOTS = [
    ("01-first-screen.png",  "/dashboard",        3000, "Dashboard"),
    ("02-second-screen.png", "/incidents",        3000, "Incidents queue"),
    # ... one per slide in src/config.ts SLIDES
]

FORCE = "--force" in sys.argv
OUT_DIR.mkdir(parents=True, exist_ok=True)


# ── Auth ───────────────────────────────────────────────────────────────────
# Contract: the target product MUST expose both `Try Demo · India` and
# `Try Demo · US` buttons on its /auth/login (or /login) page. This script
# clicks the one matching DEMO_LOCALE. If the button isn't there, the script
# exits non-zero — refuses to fall back to real credentials or to a generic
# "Try Demo" button, because either would risk capturing real user data.
#
# See CLIENT-DEMO-PLAYBOOK.md §2 for the requirement and reference
# implementation pattern.
LOGIN_PATHS = ["/auth/login", "/login"]      # tries each; first one that loads wins

async def login(page):
    assert DEMO_LOCALE in ("IN", "US"), (
        f"DEMO_LOCALE must be 'IN' or 'US' (got {DEMO_LOCALE!r}). "
        "Edit the constant at the top of take-screenshots.py."
    )
    label = "Try Demo · India" if DEMO_LOCALE == "IN" else "Try Demo · US"

    # Find the login page (path varies per product).
    last_err = None
    for p in LOGIN_PATHS:
        try:
            await page.goto(f"{BASE_URL}{p}", wait_until="domcontentloaded", timeout=30_000)
            await page.wait_for_timeout(2_000)
            if await page.locator(f'button:has-text("{label}")').count() > 0:
                break
            last_err = f"button not found on {p}"
        except Exception as e:
            last_err = f"{p}: {e.__class__.__name__}"
    else:
        sys.exit(
            f"\n✗ {label} button not found on any of {LOGIN_PATHS}. "
            f"Last error: {last_err}.\n"
            f"  The target product must expose Try Demo · India + Try Demo · US — "
            f"see CLIENT-DEMO-PLAYBOOK.md §2.\n"
            f"  If the buttons exist but are hidden by NEXT_PUBLIC_DEMO_MODE, set "
            f"that env var to 'true' in the product's deployment, then re-run."
        )

    print(f"  → clicking {label}")
    await page.locator(f'button:has-text("{label}")').first.click(timeout=8_000)

    try:
        await page.wait_for_url(lambda u: "/login" not in u, timeout=15_000)
    except Exception:
        sys.exit(
            f"\n✗ Click on {label} did not navigate away from login.\n"
            f"  Likely the /api/demo/seed?locale={DEMO_LOCALE} endpoint is missing "
            f"or returned 403 (DEMO_MODE off). Check the product's server logs."
        )
    await page.wait_for_load_state("networkidle")
    await page.wait_for_timeout(2_500)
    print(f"  ✓ signed in as {DEMO_LOCALE} demo, now at {page.url}")


# ── Optional per-shot post-action ──────────────────────────────────────────
# Some screens need a click before they're populated (open a row, expand a
# tab). Add helpers here and call them from the capture loop. Example:
#
#   async def click_first_customer(page):
#       await page.locator('text=/CUST-/').first.click(timeout=5_000)
#       await page.wait_for_timeout(2_500)
#
# Then in SHOTS, encode the action name as a 5th tuple field and dispatch
# on it.


async def main():
    async with async_playwright() as p:
        tmp = tempfile.mkdtemp(prefix="demo_shot_")
        ctx = await p.chromium.launch_persistent_context(
            user_data_dir=tmp,
            headless=True,
            viewport=VIEWPORT,
            device_scale_factor=DEVICE_SCALE,
            ignore_https_errors=True,
        )
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()

        await login(page)

        # Warm-up pass — visits each URL so first-visit hydration runs before
        # we screenshot. Otherwise data-fetch hooks may still be in flight.
        print("\n  ── warm-up pass ──")
        for fname, path, _, _ in SHOTS:
            try:
                await page.goto(BASE_URL + path, wait_until="domcontentloaded", timeout=60_000)
                await page.wait_for_timeout(800)
            except Exception as e:
                print(f"     warm-up issue {path}: {e.__class__.__name__}")

        # Capture pass
        print("\n  ── capture pass ──")
        for fname, path, wait_ms, caption in SHOTS:
            out = OUT_DIR / fname
            if out.exists() and not FORCE and out.stat().st_size > 50_000:
                print(f"  skip (exists): {fname}")
                continue
            url = BASE_URL + path
            try:
                await page.goto(url, wait_until="networkidle", timeout=60_000)
            except Exception:
                await page.goto(url, wait_until="domcontentloaded", timeout=60_000)
            await page.wait_for_timeout(wait_ms)
            # Hard reload so data hooks re-run after localStorage auth is set.
            await page.reload(wait_until="networkidle", timeout=60_000)
            await page.wait_for_timeout(3000)
            await page.screenshot(path=str(out), full_page=False)
            kb = out.stat().st_size // 1024
            print(f"  ✓ {fname:36} ({kb} KB) — {caption}")

        await ctx.close()
        files = sorted(OUT_DIR.glob("*.png"))
        print(f"\nDone. {len(files)} shots in {OUT_DIR}")


asyncio.run(main())
