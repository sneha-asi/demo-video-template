#!/usr/bin/env python3
"""Generate voiceover clips via ElevenLabs.

Usage:  ELEVENLABS_API_KEY=sk_... ELEVENLABS_VOICE_ID=<voice id> python3 gen-voiceover.py

Set:
  1. ELEVENLABS_VOICE_ID env var — the ElevenLabs voice to use (one of
     their stock voices or your own); there is no default.

Edit:
  2. SCRIPTS   — dict of {filename: text}, one per VO clip you reference in
                 src/config.ts (SLIDES[].audio)

Output files are written to public/voiceover/. Each clip's duration drives
the matching slide's `duration` in src/config.ts — if the VO is 7.2 s,
the slide should be ~210 frames + a small buffer (220–230f at 30 fps).

Lip-sync rule: kinetic phrases on the slide should be DIRECT EXCERPTS from
the VO text at that frame. Pull the anchor words from these scripts and put
them verbatim into SLIDES[].phrases.
"""
import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

API      = "https://api.elevenlabs.io/v1/text-to-speech/{voice}/stream"
VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "").strip()   # Required; no default.
MODEL    = "eleven_turbo_v2_5"

# ── Edit the scripts. Filenames must match SLIDES[].audio in src/config.ts.
SCRIPTS = {
    # Act 1 — Problem (~10s) — opens the video with the pain.
    "act-1.mp3": (
        "Today, every team has to deal with spreadsheets, Slack, ticket queues. "
        "Nobody has time to actually understand the data. "
        "Decisions are slower. Errors slip through."
    ),
    # Act 2 — Shift (~3s) — the hook.
    "act-2.mp3": (
        "What if AI did the heavy lifting?"
    ),
    # ── Per-slide VOs (one per SLIDES[i].audio) ─────────────────────────────
    # Keep these short. Each should match its slide's duration.
    "vo-slide-1.mp3": (
        "First slide narration. Keep it tight — one or two short sentences "
        "that lead into the kinetic phrases shown on the slide."
    ),
    "vo-slide-2.mp3": (
        "Second slide narration. Same shape."
    ),
    # Act 5 — Closing (~5s).
    "act-closing.mp3": (
        "The work is done. The result is waiting."
    ),
}


def synth(api_key: str, text: str, out_path: Path) -> None:
    payload = json.dumps({
        "text": text,
        "model_id": MODEL,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0},
    }).encode("utf-8")
    req = urllib.request.Request(
        API.format(voice=VOICE_ID),
        data=payload,
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
            out_path.write_bytes(data)
            print(f"  ✓ {out_path.name} ({len(data) // 1024} KB)")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:400]
        print(f"  ✗ {out_path.name}: HTTP {e.code} — {body}")
        sys.exit(2)


def main() -> None:
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        print("error: ELEVENLABS_API_KEY env var not set", file=sys.stderr)
        sys.exit(1)
    if not VOICE_ID:
        print("error: ELEVENLABS_VOICE_ID env var not set", file=sys.stderr)
        sys.exit(1)

    out_dir = Path(__file__).parent / "public" / "voiceover"
    out_dir.mkdir(parents=True, exist_ok=True)

    for fname, text in SCRIPTS.items():
        print(f"→ {fname}: {text[:60]}{'…' if len(text) > 60 else ''}")
        synth(key, text, out_dir / fname)

    print(f"\n✓ {len(SCRIPTS)} clips written to {out_dir}")


if __name__ == "__main__":
    main()
