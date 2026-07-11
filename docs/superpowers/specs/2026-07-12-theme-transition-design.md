# Theme Transition Animation — Design Spec

**Date:** 2026-07-12
**Status:** approved

## Overview

Add a smooth circular-spread transition animation when switching between the site's 6 decorative themes. Uses the View Transitions API with graceful fallback for unsupported browsers.

## Current State

- 6 decorative themes via `data-theme` on `<html>` and `<body>`
- ~30 CSS custom properties per theme (colors, gradients, shadows, glows, borders)
- Theme switch via `<select>` in SiteHeader, persisted to localStorage
- No transition animation on switch — instant snap
- Some themes (spring, summer) have decorative CSS animations (petals, stars, fireflies)

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Approach | View Transitions API | Handles ALL visual property changes (including gradients, shadows, decorative elements) via snapshot cross-fade; CSS transitions cannot interpolate these |
| Animation style | Circular spread from click position | Visually engaging; click position provides spatial context |
| Duration | 0.5s, `cubic-bezier(0.4, 0, 0.2, 1)` | Moderate pace; smooth ease-out curve |
| Reduced motion | Skip animation entirely | Consistent with existing `prefers-reduced-motion` handling for decorative elements |
| Browser fallback | `if (!document.startViewTransition)` → direct switch, no animation | Graceful degradation; no polyfill needed |

## Implementation

### Files to modify

| File | Change |
|---|---|
| `src/components/theme/SiteHeader.astro` | Wrap theme switch in `startViewTransition`, compute click coordinates & spread radius, set CSS variables |
| `public/styles.css` | Add `::view-transition` pseudo-element styles and `@keyframes theme-expand` |

### Files NOT modified

- `src/theme/config.ts` — no changes
- `src/layouts/BaseLayout.astro` — head script for first-load theme remains unchanged
- All theme CSS variable blocks — untouched
- Decorative HTML/elements — untouched

### How it works

1. User clicks the theme `<select>` → `change` event fires
2. Capture `event.clientX`, `event.clientY`
3. Compute spread radius: `Math.hypot(max(x, innerWidth-x), max(y, innerHeight-y))`
4. Set CSS variables on `:root`: `--vtx`, `--vty`, `--vtr`
5. `document.startViewTransition(() => { apply new data-theme, persist to localStorage })`
6. Browser takes old snapshot, runs callback, takes new snapshot
7. `::view-transition-new(root)` animates `clip-path` from `circle(0% at --vtx --vty)` to `circle(--vtr at --vtx --vty)`

### Animation flow

```
click select → capture (x,y) → compute r → set CSS vars
  → startViewTransition(applyTheme)
    → old snapshot captured
    → callback runs: data-theme updated, localStorage written
    → new snapshot captured
    → ::view-transition-new(root) animates clip-path 0%→r over 0.5s
    → auto cleanup
```

### CSS additions (public/styles.css)

```css
/* View Transitions — theme switch animation */
@keyframes theme-expand {
  from { clip-path: circle(0% at var(--vtx) var(--vty)); }
  to   { clip-path: circle(var(--vtr) at var(--vtx) var(--vty)); }
}

::view-transition-old(root) { animation: none; }
::view-transition-new(root) {
  animation: theme-expand 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Reduced motion: skip view transition animation */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) { animation: none; }
  ::view-transition-group(root) { animation-duration: 0s; }
}
```

### JS changes (SiteHeader.astro)

The existing theme change handler gets wrapped:

```js
// Existing: select.addEventListener('change', (event) => { applyTheme(...); localStorage.setItem(...); })
// New: select.addEventListener('change', (event) => {
//   // Use mouse position if available (mouse click), otherwise fall back to select element center (keyboard)
//   const rect = select.getBoundingClientRect();
//   const x = event.clientX || (rect.left + rect.width / 2);
//   const y = event.clientY || (rect.top + rect.height / 2);
//   const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
//   document.documentElement.style.setProperty('--vtx', x + 'px');
//   document.documentElement.style.setProperty('--vty', y + 'px');
//   document.documentElement.style.setProperty('--vtr', r + 'px');
//   if (document.startViewTransition) {
//     document.startViewTransition(() => {
//       applyTheme(event.target.value);
//       localStorage.setItem(THEME_STORAGE_KEY, next);
//     });
//   } else {
//     applyTheme(event.target.value);
//     localStorage.setItem(THEME_STORAGE_KEY, next);
//   }
// });
```

## Browser Support

| Browser | Version | Behavior |
|---|---|---|
| Chrome | 111+ | Full circular-spread animation |
| Edge | 111+ | Full circular-spread animation |
| Safari | 18.2+ | Full circular-spread animation |
| Firefox | Partial | Falls back to instant switch |
| All others | — | Falls back to instant switch |

## Constraints & Edge Cases

- **Touch devices**: `event.clientX/Y` works on touch events too — no special handling needed since we listen to `change` (not `click`)
- **Keyboard navigation**: `<select>` change via keyboard fires `change` but `event.clientX/Y` is 0. Fallback: compute spread center from the `<select>` element's bounding rect center (`rect.left + rect.width/2`, `rect.top + rect.height/2`) so the animation originates from the theme picker.
- **Rapid switching**: `startViewTransition` handles this — if a transition is already in progress, calling it again skips the current one and starts a new one
- **Theme select via URL/script**: Only fires animation when triggered through the `<select>` UI. Direct `data-theme` manipulation (head script on load) does NOT animate — intentional.

## Testing

- Manual: switch between all 6 themes in both directions, verify smooth spread animation
- Manual: test in a browser without View Transitions API, verify instant switch still works
- Manual: enable `prefers-reduced-motion: reduce` in OS, verify no animation
- Build: `npm run build` must pass
