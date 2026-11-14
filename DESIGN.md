---
version: template
name: Brand Style Guide (template)
description: Placeholder brand and product design tokens for this video template. Replace every value below with your own brand's tokens before producing a video. The structure is the contract; the values are examples.

colors:
  # Primary brand (REPLACE with your brand hexes)
  brand-accent: "#4f46e5"   # primary CTA / highlight color
  brand-deep:   "#1e1b4b"   # dark contrast hue
  brand-soft:   "#818cf8"   # lighter accent
  ivory-white:  "#ffffff"
  midnight-black: "#000000"

  # Background variables
  porcelain: "#f4f3f2"
  midnight:  "#121317"

  # Tints & Shades — Accent (darkest -> lightest)
  accent-900: "#1e1b4b"
  accent-800: "#312e81"
  accent-700: "#3730a3"
  accent-600: "#4338ca"
  accent-500: "#4f46e5"
  accent-400: "#6366f1"
  accent-300: "#818cf8"
  accent-200: "#a5b4fc"
  accent-100: "#e0e7ff"

  # Tints & Shades — Neutrals
  neutral-1000: "#000000"
  neutral-800: "#333333"
  neutral-600: "#666666"
  neutral-400: "#999999"
  neutral-200: "#cccccc"
  neutral-0: "#ffffff"
  neutral-aluminium: "#c8c8c8" # paragraph text on dark bg
  neutral-mid: "#89898b"

  # Semantic typography colors
  text-head-accent: "#4f46e5"
  text-head-primary: "#2f2f2f"         # headings on light bg
  text-body-primary: "#4d4d4d"         # paragraphs on light bg
  text-body-strong: "#111111"          # emphasis copy on light bg
  text-on-dark-paragraph: "#c8c8c8"    # paragraphs on dark bg

  # Accent at 50% alpha (inactive button states); hex8 form
  brand-accent-50a: "#4f46e580"

  # Surfaces
  surface-light: "#fefefe"
  surface-dark: "#121317"
  surface-hairline: "#e2e8f0"

typography:
  display-2xl:           # H1
    fontFamily: Manrope
    fontSize: 62px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0px"
  display-xl:            # H2
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: 500
    lineHeight: 1.24
    letterSpacing: "0px"
  display-lg:            # H3 / Section Head
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.24
    letterSpacing: "0px"
  display-md:            # H4 / Cards Head
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.24
    letterSpacing: "0px"
  display-sm:            # H5 / Cards Head
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.24
    letterSpacing: "0px"
  display-xs:            # H6 / Cards Sub-Head
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0px"
  paragraph-lg:          # Body Large
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0px"
  paragraph-md:          # Body Medium
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0px"
  paragraph-sm:          # Body Small
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0px"
  cta:                   # 12px caption / button label
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "1.2px" # 10% of 12px; uppercase
  numeric:               # monospace reserved for numeric values
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0px"
    fontFeature: "'tnum'"

spacing:
  xs: "8px"      # 0.5rem
  sm: "12px"     # 0.75rem
  md: "16px"     # 1rem
  lg: "20px"     # 1.25rem
  xl: "32px"     # 2rem
  "2xl": "48px"  # 3rem
  "3xl": "64px"  # 4rem
  "4xl": "96px"  # 6rem
  "5xl": "128px" # 8rem
  inset-sm: "12px"
  inset-md: "20px"
  inset-lg: "24px"
  inset-xl: "30px"
  container-md: "1296px" # 81rem
  container-lg: "1440px" # 90rem

rounded:
  none: "0px"
  sm: "8px"
  md: "12px"     # default for buttons, cards, inputs
  lg: "16px"
  pill: "45px"
  full: "9999px"

components:
  button-primary-web:
    backgroundColor: "{colors.brand-accent}"
    textColor: "{colors.neutral-0}"
    typography: "{typography.cta}"
    padding: "16px 28px"
    rounded: "{rounded.md}"
    gap: 10px
  button-primary-web-inactive:
    backgroundColor: "{colors.brand-accent-50a}"
    textColor: "{colors.neutral-0}"
  button-secondary-web:
    backgroundColor: transparent
    borderColor: "{colors.brand-accent}"
    borderWidth: 1px
    textColor: "{colors.brand-accent}"
    typography: "{typography.cta}"
    padding: "16px 28px"
    rounded: "{rounded.md}"
    gap: 10px
---

# Brand Style Guide (template)

> This is a **placeholder** design system shipped with the template so the
> machinery (config tokens, doctor checks, kinetic text) has something to read.
> Replace every token below with your own brand's values. The *structure* is
> what the template depends on; the *values* are examples only.

## Overview

A clean, light, enterprise SaaS aesthetic with a white canvas, a single strong
accent color, and generous spacing. Restrained and confident: large typography,
subtle borders, soft shadows, and minimal decoration so the brand accent and
bold CTAs stand out clearly. Pick **one** primary CTA color and do not promote a
secondary color into that role.

## Colors

Root the palette in one brand accent, anchored by a dark contrast hue and a base
of pure neutrals. Give every brand color a full 9-step tint/shade ramp so you can
pull background tints and shadow shades without inventing new values.

### Primary palette (example)

- **Brand Accent (`#4F46E5`):** The single primary CTA color. Filled buttons,
  key headline highlights, active UI elements, small interactive details.
- **Brand Deep (`#1E1B4B`):** A dark hue for dense sections and contrasting copy.
- **Ivory White (`#FFFFFF`):** Dominant page and card background.
- **Midnight Black (`#000000`):** Reserved for fully dark surfaces.

### Tints & shades

Every brand color has a 9-step ramp from darkest (-900) to lightest (-100), with
the canonical brand hex at the -500 step.

| Step | Accent |
| --- | --- |
| 900 | `#1E1B4B` |
| 800 | `#312E81` |
| 700 | `#3730A3` |
| 600 | `#4338CA` |
| **500** (brand) | **`#4F46E5`** |
| 400 | `#6366F1` |
| 300 | `#818CF8` |
| 200 | `#A5B4FC` |
| 100 | `#E0E7FF` |

### Neutrals

- **Neutral 1000 / 800 / 600 / 400 / 200 / 0**: `#000000`, `#333333`, `#666666`, `#999999`, `#CCCCCC`, `#FFFFFF`
- **Aluminium (`#C8C8C8`):** Paragraph text on dark backgrounds.
- **Mid Gray (`#89898B`):** Use sparingly.

### Typography colors

| Role | Hex |
| --- | --- |
| Heading — accent | `#4F46E5` |
| Heading — primary | `#2F2F2F` |
| Paragraph — primary | `#4D4D4D` |
| Paragraph — strong | `#111111` |
| Paragraph on dark bg | `#C8C8C8` |

## Typography

Three type families with strict roles (swap for your own; keep the role split):

- **Manrope** — Primary. All Display sizes and the `cta` 12px caption.
- **Inter** — Secondary. All Paragraph sizes.
- **Geist** — Numeric only. Tables, metrics, timestamps; never prose or headings.

Base weight is **500**. Display tracks at **0%**. Only `cta` 12px gets **10%
tracking** (`1.2px`) and renders **uppercase**.

### Scale

| Token | Role | Family | Size | Line-height | Weight | Letter-spacing |
| --- | --- | --- | --- | --- | --- | --- |
| `display-2xl` | H1 | Manrope | 62px | 1.2 | 500 | 0 |
| `display-xl` | H2 | Manrope | 48px | 1.24 | 500 | 0 |
| `display-lg` | H3 / Section Head | Manrope | 40px | 1.24 | 500 | 0 |
| `display-md` | H4 / Cards Head | Manrope | 32px | 1.24 | 500 | 0 |
| `display-sm` | H5 / Cards Head | Manrope | 28px | 1.24 | 500 | 0 |
| `display-xs` | H6 / Cards Sub-Head | Manrope | 24px | 1.3 | 500 | 0 |
| `paragraph-lg` | Body Large | Inter | 20px | 1.3 | 500 | 0 |
| `paragraph-md` | Body Medium | Inter | 16px | 1.3 | 500 | 0 |
| `paragraph-sm` | Body Small | Inter | 14px | 1.3 | 500 | 0 |
| `cta` | Caption / button label | Manrope | 12px | 1.25 | 700 | 1.2px (10%), uppercase |
| `numeric` | Numeric values | Geist | 16px | 1.3 | 500 | 0 |

## Layout

Base spacing follows an 8-multiple progression: **8 / 12 / 16 / 20 / 32 / 48 /
64 / 96 / 128 px**. Use larger steps for hero and section breaks; smaller steps
for component-level rhythm.

- **Inset (uniform):** 12, 20, 24, 30 px for padding inside surfaces.
- **Container widths:** Medium `1296px` (81rem), Large `1440px` (90rem).

## Elevation & Depth

Predominantly flat. Hierarchy comes from typography weight, color contrast, and
hairline borders — not heavy drop shadows. Lean on the `#E2E8F0` hairline for
separation between cards, inputs, and content surfaces.

## Shapes

Soft-modern: **12px** corner radius is the default for every interactive surface
(buttons, cards, inputs, icon toggles).

| Token | Value | Use |
| --- | --- | --- |
| `rounded.none` | 0 | Hairline rules, separators |
| `rounded.sm` | 8px | Tight UI atoms, chips |
| **`rounded.md`** | **12px** | **Default — buttons, cards, inputs** |
| `rounded.lg` | 16px | Marketing surface panels |
| `rounded.full` | 9999px | Pills and chip-like elements |

## Do's and Don'ts

- **Do** keep a single primary CTA color. Promote nothing else.
- **Do** use the 8-multiple spacing scale and the 12px default radius.
- **Do** default to one display family for headings/CTAs, one for paragraphs,
  and a monospace family *only* for numeric values.
- **Don't** introduce new corner radii, shadow tokens, or spacing values outside
  the documented scale.
- **Don't** apply heavy drop shadows; lean on hairlines, whitespace, and contrast.
