# Demo-Video Rules — Apply to ALL videos in this folder

These rules apply to every video under `$DEMO_VIDEOS_ROOT/*/` (default `~/demo-videos/*/`):
**convopilot · casepilot · loopd · dropkit · pulse · shecodes**

If a rule is violated, the video gets re-flagged. They are not preferences — they are the bar.

---

## 1. Screenshots: never cut top, never whitespace

**Rule.** Screenshots inside the montage must (a) never crop the top edge of the page, (b) never show whitespace beside or above the screenshot.

**Implementation — copy verbatim.**
```ts
// In ScreenshotMontage.tsx
const CARD_W = 1480, CARD_H = 832;

// COVER-FIT: image always fills the card. No letterboxing possible.
function zoomT(cx: number, cy: number, zoom: number, iw: number, ih: number): string {
  const fitScale  = Math.max(CARD_W / iw, CARD_H / ih); // ← Math.max, NEVER min
  const totalScale = fitScale * zoom;
  const tx = CARD_W / 2 - (iw * cx / 100) * totalScale;
  const ty = CARD_H / 2 - (ih * cy / 100) * totalScale;
  return `translate(${tx}px,${ty}px) scale(${totalScale})`;
}
```

**Top-anchor cy values** (so image-top sits at card-top):
```ts
// Compute per slide based on its image dimensions:
//   cy_top_aligned = CARD_H / (2 * ih * fitScale * zoom) * 100
// At zoom 1.00, image height ih=1287: cy ≈ 44
// At zoom 1.20, same image:           cy ≈ 37
// At zoom 1.30, same image:           cy ≈ 33
// At zoom 1.00, image height ih=1058: cy ≈ 50  (16:9 — top-aligned at centre)
```

Always pass `iw` and `ih` per slide — they vary per screenshot.

---

## 2. Zoom in AND zoom out — visible camera moves

**Rule.** Each montage slide must contain at least **3 distinct camera moves** so the viewer perceives motion: wide → push in → pull back → SLAM. Single-zoom slides feel static.

**Implementation — 4 hotspots per slide minimum.**
```ts
hotspots: [
  { frame: 0,           x: 50, y: TOP_CY_WIDE,  zoom: 1.00 },               // wide
  { frame: TIME_1,      x: 50, y: TOP_CY_MID,   zoom: 1.20 },               // ZOOM IN
  { frame: TIME_2,      x: 50, y: TOP_CY_WIDE,  zoom: 1.00 },               // ZOOM OUT
  { frame: SLAM_FRAME,  x: PAN_X, y: TOP_CY_TIGHT, zoom: 1.30, punch: true }, // SLAM
]
```

**Pan direction matches what's spoken** at the SLAM frame:
- Talking about the funnel chart on the LEFT? `x: 42` (slight left)
- Talking about the AI panel on the RIGHT? `x: 58` (slight right)
- Talking about something in the CENTRE? `x: 50`

Pan range must stay inside the safe zone for the chosen zoom (otherwise card edges get exposed). At zoom 1.30, safe `x` range is roughly `[40, 60]`.

---

## 3. Different music per video

**Rule.** No two videos share the same music track. Each video has its own audio identity.

**Per-video mapping** (current):
| Video | Track |
|---|---|
| convopilot | TBD (was `caravan.mp3`) — pick something distinct |
| casepilot | TBD — pick something distinct |
| loopd | `music.mp3` |
| dropkit | `future-fashion.mp3` |
| pulse | `pulse-music.mp3` |
| shecodes | `amplify-beat.mp3` |

**Music mix knobs** (consistent across all videos):
```ts
const BASE_FLOOR = 0.05;  // ambient bed during text scenes
const BASE_PEAK  = 0.10;  // bed level during montage
const PULSE_AMP  = 0.06;  // per-shock spike
const CAP        = 0.18;  // hard ceiling — music never louder than this
```

Music must duck under VO so dialogue is always intelligible. SHOCK_FRAMES align with SLAM hotspot frames in the montage.

---

## 4. Lip-sync: on-screen text mirrors what's spoken

**Rule.** Every kinetic phrase on screen is a near-verbatim excerpt of the VO at that frame. If the VO says "auto-post in one click" at frame N, the phrase visible at frame N is "Auto-post." — not a paraphrase, not a different idea.

**How to derive phrases:**
1. Open the VO script (lives in `gen-voiceover.py` or equivalent inside the project)
2. For each VO sentence, pick 2–3 *anchor words* — the ones a viewer would lean in for
3. Each anchor word becomes a kinetic phrase, frame-aligned to roughly when it's spoken
4. The LAST anchor word is the SLAM phrase (impact: true) and lands on the SLAM hotspot frame

**Anti-pattern.** Never write a kinetic phrase that summarizes the VO in your own words ("Type a moment. Get a collection." when the VO says "IPL 2026. Nine point two…"). Pick *from the VO*.

---

## 5. Not wordy — punch words only

**Rule.** Each kinetic phrase is **1–3 words** max. No full sentences. Hard cap: **8 words total per slide** across all 3 phrases.

**Examples that pass.**
- "Every channel." — "One calendar." — "Auto-post." (5 words total) ✓
- "Underperforms?" — "Loopd diagnoses." — "Regenerates." (4 words total) ✓

**Examples that fail.**
- "Schedule Instagram, Reels, email, and Google Ads from a single view." (12 words) ✗
- "Marketers copy-paste captions, re-upload Reels, and guess what worked." (10 words) ✗

The Problem scene is the same — middle "list-like" sentences must be split into individual punch words (each on its own beat), DropKit-style: `Brief. / Designs. / Tech packs. / Buy plans.`

---

## 6. Pattern recognition — all 6 videos are siblings

**Rule.** Composition structure, scene styling, kinetic typography, card chrome, and closing pattern must be identical across all 6 videos. They should read as a *family*, not as 6 different videos.

**The canonical structure (5 acts):**
```
Problem → Shift → Reveal → ScreenshotMontage → Closing
```

No bespoke per-product scenes (no `ContentGenScene`, no `FunnelScene`). Everything that's product-specific lives inside the **screenshots**, not in custom scenes. The composition is the same shape every time — the screenshots and VO are what's different.

**Identical chrome (copy-paste these constants):**
- Card: `1480 × 832` centred, `220px` side margins, `124px` top/bottom
- Card surface: `BG_CARD = #f9fafb`
- Card border: `1px solid #e2e8f0`
- Card shadow: `0 18px 48px rgba(79,70,229,0.06), 0 4px 16px rgba(15,23,42,0.04)`
- Card radius: `16px`

**Identical step badge:**
- `12px` text, weight 700, `0.22em` letter-spacing, uppercase
- `borderRadius: 999` (fully rounded pill)
- Background `rgba(79,70,229,0.06)`, border `rgba(79,70,229,0.20)`
- Color `#4f46e5` (brand accent)
- Position: `top: 56px, centred`

**Identical kinetic phrase:**
- Default font size 88–96px, weight 700, letter-spacing -0.03em
- Impact font size **132px**, weight 800, letter-spacing -0.04em
- Default colour `#2f2f2f`, impact colour `#4f46e5`
- Position: `bottom: 56px, centred`
- Impact spring: `{ damping: 12, stiffness: 580, mass: 0.22 }` with scale overshoot `1.45 → 1.0`
- Subtle blue bloom on impact: `text-shadow: 0 0 56px ${color}28, 0 0 14px ${color}1a`

**Identical closing:**
- 4 elements stacked: brand glyph/wordmark → tagline (with accent on key phrase) → sub line → "That's [Brand]." CTA pill
- CTA pill: `background: linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, `borderRadius: 16`, `padding: "20px 56px"`, white text 32px weight 700

---

## 7. Brand: your surround, app branding only inside screenshots

**Rule.** The video composition (canvas, badges, kinetic text, closing pill) follows your brand `DESIGN.md` (white canvas, single accent color, Manrope, generous spacing). The dark/coloured branding inside the screenshots themselves is *the product's* — that's fine, it's content. The video frame around it is always your brand.

`constants.ts` should expose your brand tokens (with legacy names like `BG_DARK` kept for compatibility but values flipped).

---

## Checklist before declaring a video done

- [ ] Top of every screenshot is visible at every frame
- [ ] No whitespace anywhere around the screenshot
- [ ] At least 3 visible camera moves per slide (wide → in → out → SLAM)
- [ ] Each kinetic phrase is 1–3 words and quotes the VO directly
- [ ] Total ≤ 8 words per slide
- [ ] Music is unique to this video (not reused from another)
- [ ] Music ducked: never louder than CAP (0.18)
- [ ] Composition is 5-act (no bespoke scenes)
- [ ] Card / step badge / kinetic phrase / closing CTA match the canonical chrome above
- [ ] Total runtime under 90 seconds (60s preferred)
- [ ] Renders cleanly with `npm run render`

If any box is unchecked, the video is not done.
