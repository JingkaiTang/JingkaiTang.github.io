# Theme Transition Animation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a smooth circular-spread transition animation when switching between the site's 6 decorative themes using the View Transitions API.

**Architecture:** Two files modified — CSS animation keyframes and pseudo-elements in `public/styles.css`, and the theme `change` event handler in `src/components/theme/SiteHeader.astro` wrapped in `document.startViewTransition()`. No new dependencies, no file structure changes.

**Tech Stack:** Vanilla CSS + vanilla JS, View Transitions API, Astro `is:inline` script

## Global Constraints

- Must pass `npm run build` after all changes
- 0.5s animation duration, `cubic-bezier(0.4, 0, 0.2, 1)` easing
- Respect `prefers-reduced-motion: reduce` — skip animation entirely
- Graceful fallback: if `!document.startViewTransition`, apply theme instantly
- Mouse click drives spread origin; keyboard falls back to select element center

---

### Task 1: Add View Transitions CSS to public/styles.css

**Files:**
- Modify: `public/styles.css` — add after the summer bamboo styles (before reduced-motion section)

**Interfaces:**
- Produces: CSS variables `--vtx`, `--vty`, `--vtr` (set by JS in Task 2, consumed by `@keyframes theme-expand`)
- Produces: `::view-transition-old(root)`, `::view-transition-new(root)` pseudo-element rules
- Produces: reduced-motion rules inside existing `@media (prefers-reduced-motion: reduce)` block

- [ ] **Step 1: Add `@keyframes theme-expand` before the reduced-motion section**

Insert on a new line before the `/* Accessibility: Respect reduced motion preferences */` comment (line 980):

```css
/* -----------------------------------------------
   View Transitions — theme switch spread animation
   ----------------------------------------------- */
@keyframes theme-expand {
  from { clip-path: circle(0% at var(--vtx) var(--vty)); }
  to   { clip-path: circle(var(--vtr) at var(--vtx) var(--vty)); }
}

::view-transition-old(root) {
  animation: none;
}

::view-transition-new(root) {
  animation: theme-expand 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

- [ ] **Step 2: Add reduced-motion override inside the existing `@media (prefers-reduced-motion: reduce)` block**

After the existing `:root[data-theme='summer'] ...` rules (line 989, before the closing `}` of the media query on line 990), add:

```css
  /* Skip view transition animation */
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
  ::view-transition-group(root) {
    animation-duration: 0s;
  }
```

- [ ] **Step 3: Build to verify no CSS parse errors**

```bash
npm run build
```

Expected: build succeeds, no CSS errors.

- [ ] **Step 4: Commit**

```bash
git add public/styles.css
git commit -m "feat: add View Transitions CSS for theme switch animation"
```

---

### Task 2: Wrap theme change handler in startViewTransition

**Files:**
- Modify: `src/components/theme/SiteHeader.astro` — the inline `<script is:inline>` block, lines 65-75

**Interfaces:**
- Consumes: CSS variables `--vtx`, `--vty`, `--vtr` (set here, consumed by CSS in Task 1)
- Consumes: `document.startViewTransition` API
- Produces: Spread origin coordinates and radius set on `document.documentElement.style`

- [ ] **Step 1: Replace the `select.addEventListener('change', ...)` block at lines 67-75**

Replace the current handler (lines 67-75):

```js
      select.addEventListener('change', (event) => {
        const target = event.target;
        const next = applyTheme(target?.value || DEFAULT_THEME);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
          // ignore storage errors
        }
      });
```

With the new handler:

```js
      select.addEventListener('change', (event) => {
        // Compute spread origin: mouse position if available, otherwise select element center
        const rect = select.getBoundingClientRect();
        const ox = event.clientX || (rect.left + rect.width / 2);
        const oy = event.clientY || (rect.top + rect.height / 2);

        // Compute radius needed to cover the entire viewport from origin
        const r = Math.hypot(
          Math.max(ox, innerWidth - ox),
          Math.max(oy, innerHeight - oy),
        );

        // Set CSS variables consumed by @keyframes theme-expand
        document.documentElement.style.setProperty('--vtx', ox + 'px');
        document.documentElement.style.setProperty('--vty', oy + 'px');
        document.documentElement.style.setProperty('--vtr', r + 'px');

        // Theme switch logic (extracted so it can run inside or outside startViewTransition)
        const switchTheme = () => {
          const next = applyTheme(event.target?.value || DEFAULT_THEME);
          try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
          } catch {
            // ignore storage errors
          }
        };

        // Use View Transitions API if available, otherwise apply instantly
        if (document.startViewTransition) {
          document.startViewTransition(() => switchTheme());
        } else {
          switchTheme();
        }
      });
```

- [ ] **Step 2: Build to verify no JS parse errors**

```bash
npm run build
```

Expected: build succeeds, no errors.

- [ ] **Step 3: Manual smoke test (visual)**

```bash
npm run dev -- --host 127.0.0.1 --port 4321
```

1. Open `http://127.0.0.1:4321` in a View-Transitions-capable browser (Chrome/Edge)
2. Click the theme `<select>` in the header and change themes
3. Verify: circular spread animation radiates from click position over ~0.5s
4. Switch between all 6 themes in both directions
5. Verify: select remains synced, page renders correctly after each switch
6. Refresh page — verify saved theme loads correctly (no animation on load)

- [ ] **Step 4: Manual test — keyboard navigation**

1. Tab to the theme `<select>`
2. Use arrow keys to change theme and press Enter
3. Verify: spread originates from the select element's position (not top-left corner)

- [ ] **Step 5: Manual test — reduced motion**

1. Enable `prefers-reduced-motion: reduce` in browser DevTools or OS settings
2. Change themes
3. Verify: instant switch, no animation

- [ ] **Step 6: Manual test — fallback browser**

1. Open the dev server in a browser without View Transitions API (e.g. older Firefox)
2. Change themes
3. Verify: instant switch, no errors in console

- [ ] **Step 7: Commit**

```bash
git add src/components/theme/SiteHeader.astro
git commit -m "feat: add View Transitions theme switch spread animation"
```
