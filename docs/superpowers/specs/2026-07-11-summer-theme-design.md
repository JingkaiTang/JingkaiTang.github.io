# Summer Theme (夏夜·竹林萤火) — Design Spec

## Overview

Add a new `summer` theme to the existing theme system. Dark mode with a
starry-night + bamboo-silhouette background and animated firefly particles.
The concept is "夏夜微光" — a quiet summer night with crescent moon, bamboo
groves, and flickering fireflies.

## Color Palette

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg` | `#070b17` | Main background (deep night sky) |
| `--surface` | `rgba(10, 15, 26, 0.82)` | Card/surface backgrounds |
| `--primary` | `#f5c542` | Primary accent (warm gold — firefly glow) |
| `--accent` | `#7ec8e3` | Secondary accent (evening sky blue) |
| `--text` | `#e0e5ef` | Body text (soft white-blue) |
| `--muted` | `#7a8499` | Muted/secondary text |
| `--border` | `rgba(245, 197, 66, 0.12)` | Borders and dividers |
| `--glow` | `0 0 28px rgba(245, 197, 66, 0.2)` | Primary glow |
| `--bg-orb-1` | rgba(245, 197, 66, 0.04) | Background radial orb 1 |
| `--bg-orb-2` | rgba(126, 200, 227, 0.03) | Background radial orb 2 |
| `--avatar-border` | rgba(245, 197, 66, 0.2) | Avatar border |
| `--hover-glow` | rgba(245, 197, 66, 0.15) | Hover state glow |
| `--panel-border-soft` | rgba(245, 197, 66, 0.08) | Soft panel border |
| `--panel-accent-soft` | rgba(245, 197, 66, 0.06) | Soft panel accent |
| `--panel-bg-strong` | rgba(8, 12, 24, 0.88) | Strong panel background |
| `--stack-bg` | rgba(245, 197, 66, 0.08) | Stack element background |
| `--field-bg` | rgba(8, 12, 24, 0.7) | Input field background |
| `--text-strong` | rgba(224, 229, 239, 0.96) | Strong text |
| `--text-dim-strong` | rgba(224, 229, 239, 0.88) | Dim strong text |
| `--blockquote-border` | rgba(245, 197, 66, 0.25) | Blockquote border |
| `--blockquote-text` | rgba(224, 229, 239, 0.85) | Blockquote text |
| `--blockquote-bg` | rgba(8, 12, 24, 0.35) | Blockquote background |
| `--code-bg` | rgba(245, 197, 66, 0.06) | Inline code background |
| `--code-border` | rgba(245, 197, 66, 0.12) | Inline code border |
| `--pre-bg` | rgba(8, 12, 24, 0.75) | Code block background |
| `--image-border` | rgba(245, 197, 66, 0.1) | Image border |
| `--toc-bg` | rgba(10, 15, 26, 0.55) | Table of contents bg |
| `--modal-border` | rgba(245, 197, 66, 0.12) | Modal border |
| `--modal-bg` | rgba(8, 12, 24, 0.92) | Modal background |
| `--modal-divider` | rgba(245, 197, 66, 0.08) | Modal divider |
| `--modal-close-border` | rgba(245, 197, 66, 0.1) | Modal close button border |

`color-scheme: dark`

## Scene Elements (CSS-only, no JS)

All positioned in a fixed full-screen container behind content (z-index: 0).

### Stars (~15 dots)
- Small circles (1.5–3px), pure white, in upper 25% of screen
- Random positions, `animation: twinkle` with varying `--d` (1.8–3.8s)
- A few with subtle `box-shadow` for brighter appearance
- Behind all other content

### Crescent Moon (top-right)
- A single element using `box-shadow` offset to create crescent shape
- Warm golden (#f5d796), ~48×48px
- Soft radial glow behind it (~140px)

### Bamboo Silhouettes (bottom ~55% of screen)
- 5 clusters, each with 3–5 stalks
- Stalks: pure `#010101`, 6–13px wide, up to ~85% of cluster height
- Slight rotation (±2–8°) for natural variety
- Horizontal node lines (`::before`) every 18–38% up each stalk
- Small leaves (`::after`) on some stalks
- All `position: absolute; bottom: 0` within cluster container

### Fireflies (~12 dots)
- Small circles (4–7px) with warm gold radial gradient
- `box-shadow` for outer glow
- Positioned mainly in the bamboo zone (lower 60% of screen)
- `animation: firefly-flicker` with irregular timing (2.1–3.8s cycles)
- Random `animation-delay` for desynchronized flicker

### Accessibility
- All decorative elements use `pointer-events: none`
- `prefers-reduced-motion: reduce` disables all animations

## Files to Modify

### `src/theme/config.ts`
- Add `'summer'` to `ThemeKey` type union
- Add `'summer'` to `THEME_KEYS` array
- Add entry to `THEME_OPTIONS` array: `{ value: 'summer', label: '🌙 夏夜' }`

### `public/styles.css`
- Add `:root[data-theme='summer']` block with all ~33 CSS variables
- Add star, moon, bamboo, firefly CSS rules (scene container + moon + stars + bamboo clusters + fireflies + keyframes + reduced-motion)

### `src/layouts/BaseLayout.astro`
- Add the scene HTML after the `.ambient-glow` and `.spring-petals` elements:
  - `.summer-scene` container
  - Inside: `.summer-moon`, `.summer-stars` (15 divs), `.summer-bamboo` (5 cluster divs with stalk divs inside), `.summer-fireflies` (12 divs)

## Approximate Size
- ~120 lines of CSS in `public/styles.css`
- ~40 lines of HTML in `BaseLayout.astro`
- ~3 lines config change in `config.ts`
