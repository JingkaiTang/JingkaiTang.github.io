# Summer Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `summer` dark-mode theme with starry night, crescent moon, bamboo silhouettes, and animated fireflies.

**Architecture:** Add theme entry to config → add CSS variables + scene styles → add scene HTML. Three independent files, no new components.

**Tech Stack:** Astro, CSS (no JS for animations), CSS custom properties.

## Global Constraints

- Must pass `npm run build` after all changes.
- Theme key must be `'summer'`.
- All scene elements must be `pointer-events: none`, with `z-index: 0` so they sit behind content.
- Must respect `prefers-reduced-motion: reduce`.

---

### Task 1: Register summer theme in config

**Files:**
- Modify: `src/theme/config.ts`

**Interfaces:**
- Consumes: existing `ThemeKey` type, `THEME_KEYS`, `THEME_OPTIONS`
- Produces: `'summer'` added to the type union, keys array, and options array

- [ ] **Step 1: Add 'summer' to ThemeKey type**

```typescript
export type ThemeKey = 'tech' | 'day' | 'night' | 'cny' | 'spring' | 'summer';
```

- [ ] **Step 2: Add 'summer' to THEME_KEYS**

```typescript
export const THEME_KEYS: ThemeKey[] = ['tech', 'day', 'night', 'cny', 'spring', 'summer'];
```

- [ ] **Step 3: Add summer option to THEME_OPTIONS**

```typescript
{ value: 'summer', label: '🌙 夏夜' },
```

Insert before the closing `];` after the spring entry.

- [ ] **Step 4: Verify**

```bash
npm run build
```
Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add src/theme/config.ts
git commit -m "feat(theme): register summer theme in config"
```

---

### Task 2: Add summer color variables + scene CSS

**Files:**
- Modify: `public/styles.css`

**Interfaces:**
- Consumes: `[data-theme='summer']` selector convention from existing themes
- Produces: CSS variables and scene element styles consumed by BaseLayout.astro's HTML

- [ ] **Step 1: Add `:root[data-theme='summer']` color block after the spring block (line 184)**

Insert at line 184, after the closing `}` of `:root[data-theme='spring']`:

```css
:root[data-theme='summer'] {
  --bg: #070b17;
  --surface: rgba(10, 15, 26, 0.82);
  --primary: #f5c542;
  --accent: #7ec8e3;
  --text: #e0e5ef;
  --muted: #7a8499;
  --border: rgba(245, 197, 66, 0.12);
  --glow: 0 0 28px rgba(245, 197, 66, 0.2);
  --bg-orb-1: rgba(245, 197, 66, 0.04);
  --bg-orb-2: rgba(126, 200, 227, 0.03);
  --avatar-border: rgba(245, 197, 66, 0.2);
  --hover-glow: rgba(245, 197, 66, 0.15);
  --panel-border-soft: rgba(245, 197, 66, 0.08);
  --panel-accent-soft: rgba(245, 197, 66, 0.06);
  --panel-bg-strong: rgba(8, 12, 24, 0.88);
  --stack-bg: rgba(245, 197, 66, 0.08);
  --field-bg: rgba(8, 12, 24, 0.7);
  --text-strong: rgba(224, 229, 239, 0.96);
  --text-dim-strong: rgba(224, 229, 239, 0.88);
  --blockquote-border: rgba(245, 197, 66, 0.25);
  --blockquote-text: rgba(224, 229, 239, 0.85);
  --blockquote-bg: rgba(8, 12, 24, 0.35);
  --code-bg: rgba(245, 197, 66, 0.06);
  --code-border: rgba(245, 197, 66, 0.12);
  --pre-bg: rgba(8, 12, 24, 0.75);
  --image-border: rgba(245, 197, 66, 0.1);
  --toc-bg: rgba(10, 15, 26, 0.55);
  --modal-border: rgba(245, 197, 66, 0.12);
  --modal-bg: rgba(8, 12, 24, 0.92);
  --modal-divider: rgba(245, 197, 66, 0.08);
  --modal-close-border: rgba(245, 197, 66, 0.1);
  color-scheme: dark;
}
```

- [ ] **Step 2: Add summer scene CSS at end of file (before `prefers-reduced-motion` block)**

Add after the spring petal animations (after line 713):

```css
/* Summer Theme Decorations — Night Sky, Bamboo, Fireflies */
:root[data-theme='summer'] .summer-scene {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(to bottom, #0a0f1e 0%, #111827 25%, #1e2740 45%, #33415e 65%, #4a5a78 80%, #5e6e8a 100%);
}

:root[data-theme='summer'] .summer-moon {
  position: absolute;
  top: 6%;
  right: 18%;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: transparent;
  box-shadow: 8px -6px 0 3px #f5d796;
  z-index: 1;
}

:root[data-theme='summer'] .summer-moon-glow {
  position: absolute;
  top: 4%;
  right: 14%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 215, 150, 0.08), transparent 70%);
  pointer-events: none;
}

:root[data-theme='summer'] .summer-star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  animation: summer-twinkle var(--d) ease-in-out infinite alternate;
}
:root[data-theme='summer'] .summer-star:nth-child(1) { width: 2px; height: 2px; top: 6%; left: 8%; --d: 2.4s; }
:root[data-theme='summer'] .summer-star:nth-child(2) { width: 3px; height: 3px; top: 12%; left: 22%; --d: 3.1s; box-shadow: 0 0 4px rgba(255,255,255,0.5); }
:root[data-theme='summer'] .summer-star:nth-child(3) { width: 1.5px; height: 1.5px; top: 4%; left: 35%; --d: 1.8s; }
:root[data-theme='summer'] .summer-star:nth-child(4) { width: 2.5px; height: 2.5px; top: 14%; left: 48%; --d: 2.7s; box-shadow: 0 0 3px rgba(255,255,255,0.35); }
:root[data-theme='summer'] .summer-star:nth-child(5) { width: 2px; height: 2px; top: 8%; left: 62%; --d: 3.5s; }
:root[data-theme='summer'] .summer-star:nth-child(6) { width: 2px; height: 2px; top: 18%; left: 76%; --d: 2.1s; }
:root[data-theme='summer'] .summer-star:nth-child(7) { width: 1.5px; height: 1.5px; top: 3%; left: 88%; --d: 2.9s; }
:root[data-theme='summer'] .summer-star:nth-child(8) { width: 3px; height: 3px; top: 22%; left: 14%; --d: 2.5s; box-shadow: 0 0 4px rgba(255,255,255,0.4); }
:root[data-theme='summer'] .summer-star:nth-child(9) { width: 2px; height: 2px; top: 10%; left: 44%; --d: 3.3s; }
:root[data-theme='summer'] .summer-star:nth-child(10) { width: 1.5px; height: 1.5px; top: 25%; left: 60%; --d: 1.9s; }
:root[data-theme='summer'] .summer-star:nth-child(11) { width: 2px; height: 2px; top: 14%; left: 92%; --d: 2.6s; }
:root[data-theme='summer'] .summer-star:nth-child(12) { width: 2.5px; height: 2.5px; top: 5%; left: 55%; --d: 3.8s; box-shadow: 0 0 3px rgba(255,255,255,0.3); }
:root[data-theme='summer'] .summer-star:nth-child(13) { width: 1.5px; height: 1.5px; top: 20%; left: 72%; --d: 2.2s; }
:root[data-theme='summer'] .summer-star:nth-child(14) { width: 2px; height: 2px; top: 2%; left: 15%; --d: 3.4s; }
:root[data-theme='summer'] .summer-star:nth-child(15) { width: 2px; height: 2px; top: 10%; left: 82%; --d: 2.8s; }

@keyframes summer-twinkle {
  0% { opacity: 0.15; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

:root[data-theme='summer'] .summer-bamboo {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 55%;
  overflow: visible;
  z-index: 1;
}

:root[data-theme='summer'] .summer-cluster {
  position: absolute;
  bottom: 0;
  height: 100%;
}

:root[data-theme='summer'] .summer-stalk {
  position: absolute;
  bottom: 0;
  border-radius: 2px;
  background: #010101;
}

:root[data-theme='summer'] .summer-cluster.summer-cluster-1 { left: 3%; }
:root[data-theme='summer'] .summer-cluster.summer-cluster-2 { left: 22%; }
:root[data-theme='summer'] .summer-cluster.summer-cluster-3 { left: 44%; }
:root[data-theme='summer'] .summer-cluster.summer-cluster-4 { left: 64%; }
:root[data-theme='summer'] .summer-cluster.summer-cluster-5 { left: 85%; }

/* Cluster 1 */
:root[data-theme='summer'] .summer-cluster-1 .s1 { left: 0;   height: 70%; width: 10px; transform: rotate(-3deg);  transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-1 .s2 { left: 8px; height: 50%; width: 7px;  transform: rotate(4deg);   transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-1 .s3 { left: 15px;height: 85%; width: 11px; transform: rotate(-5deg);  transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-1 .s4 { left: 24px;height: 38%; width: 6px;  transform: rotate(3deg);   transform-origin: bottom; }

/* Cluster 2 */
:root[data-theme='summer'] .summer-cluster-2 .s1 { left: 0;   height: 80%; width: 12px; transform: rotate(-3deg);  transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-2 .s2 { left: 10px;height: 58%; width: 8px;  transform: rotate(-6deg);  transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-2 .s3 { left: 17px;height: 42%; width: 7px;  transform: rotate(2deg);   transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-2 .s4 { left: 24px;height: 90%; width: 11px; transform: rotate(-4deg);  transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-2 .s5 { left: 33px;height: 32%; width: 6px;  transform: rotate(6deg);   transform-origin: bottom; }

/* Cluster 3 */
:root[data-theme='summer'] .summer-cluster-3 .s1 { left: 0;   height: 65%; width: 9px;  transform: rotate(5deg);   transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-3 .s2 { left: 7px; height: 38%; width: 7px;  transform: rotate(-2deg);  transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-3 .s3 { left: 13px;height: 75%; width: 10px; transform: rotate(3deg);   transform-origin: bottom; }

/* Cluster 4 */
:root[data-theme='summer'] .summer-cluster-4 .s1 { left: 0;   height: 48%; width: 8px;  transform: rotate(-4deg);  transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-4 .s2 { left: 7px; height: 88%; width: 13px; transform: rotate(2deg);   transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-4 .s3 { left: 19px;height: 68%; width: 9px;  transform: rotate(-3deg);  transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-4 .s4 { left: 27px;height: 95%; width: 11px; transform: rotate(5deg);   transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-4 .s5 { left: 36px;height: 35%; width: 6px;  transform: rotate(-6deg);  transform-origin: bottom; }

/* Cluster 5 */
:root[data-theme='summer'] .summer-cluster-5 .s1 { left: 0;   height: 72%; width: 10px; transform: rotate(3deg);   transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-5 .s2 { left: 8px; height: 48%; width: 7px;  transform: rotate(-4deg);  transform-origin: bottom; }
:root[data-theme='summer'] .summer-cluster-5 .s3 { left: 14px;height: 35%; width: 6px;  transform: rotate(6deg);   transform-origin: bottom; }

/* Bamboo nodes & leaves */
:root[data-theme='summer'] .summer-stalk::before {
  content: '';
  position: absolute;
  left: -1px; right: -1px;
  height: 2px;
  background: #000;
  border-radius: 2px;
}
:root[data-theme='summer'] .summer-cluster-1 .s1::before { top: 26%; }
:root[data-theme='summer'] .summer-cluster-1 .s2::before { top: 33%; }
:root[data-theme='summer'] .summer-cluster-1 .s3::before { top: 20%; }
:root[data-theme='summer'] .summer-cluster-1 .s4::before { top: 36%; }
:root[data-theme='summer'] .summer-cluster-2 .s1::before { top: 22%; }
:root[data-theme='summer'] .summer-cluster-2 .s2::before { top: 28%; }
:root[data-theme='summer'] .summer-cluster-2 .s3::before { top: 34%; }
:root[data-theme='summer'] .summer-cluster-2 .s4::before { top: 18%; }
:root[data-theme='summer'] .summer-cluster-2 .s5::before { top: 38%; }
:root[data-theme='summer'] .summer-cluster-3 .s1::before { top: 28%; }
:root[data-theme='summer'] .summer-cluster-3 .s2::before { top: 36%; }
:root[data-theme='summer'] .summer-cluster-3 .s3::before { top: 22%; }
:root[data-theme='summer'] .summer-cluster-4 .s1::before { top: 30%; }
:root[data-theme='summer'] .summer-cluster-4 .s2::before { top: 18%; }
:root[data-theme='summer'] .summer-cluster-4 .s3::before { top: 24%; }
:root[data-theme='summer'] .summer-cluster-4 .s4::before { top: 15%; }
:root[data-theme='summer'] .summer-cluster-4 .s5::before { top: 37%; }
:root[data-theme='summer'] .summer-cluster-5 .s1::before { top: 24%; }
:root[data-theme='summer'] .summer-cluster-5 .s2::before { top: 32%; }
:root[data-theme='summer'] .summer-cluster-5 .s3::before { top: 38%; }

:root[data-theme='summer'] .summer-stalk::after {
  content: '';
  position: absolute;
  width: 14px; height: 5px;
  background: #010101;
  border-radius: 0 5px 0 3px;
  transform-origin: left center;
}
:root[data-theme='summer'] .summer-cluster-1 .s3::after { top: 14%; right: -8px; transform: rotate(35deg) scaleX(1.3); }
:root[data-theme='summer'] .summer-cluster-2 .s1::after { top: 16%; left: -10px; transform: rotate(-28deg) scaleX(1.2); }
:root[data-theme='summer'] .summer-cluster-2 .s4::after { top: 12%; right: -9px; transform: rotate(38deg) scaleX(1.3); }
:root[data-theme='summer'] .summer-cluster-3 .s3::after { top: 16%; right: -8px; transform: rotate(32deg) scaleX(1.2); }
:root[data-theme='summer'] .summer-cluster-4 .s2::after { top: 12%; right: -10px; transform: rotate(40deg) scaleX(1.4); }
:root[data-theme='summer'] .summer-cluster-4 .s4::after { top: 8%;  left: -11px; transform: rotate(-32deg) scaleX(1.3); }
:root[data-theme='summer'] .summer-cluster-5 .s1::after { top: 18%; left: -8px; transform: rotate(-35deg) scaleX(1.1); }

:root[data-theme='summer'] .summer-ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6%;
  background: #010101;
  z-index: 2;
}

:root[data-theme='summer'] .summer-firefly {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, #ffe57f, #f5c542);
  box-shadow: 0 0 8px rgba(245, 197, 66, 0.6), 0 0 20px rgba(245, 197, 66, 0.2);
  animation: summer-flicker var(--fd) ease-in-out infinite alternate;
  z-index: 3;
}
:root[data-theme='summer'] .summer-firefly:nth-child(1)  { width: 6px; height: 6px;  bottom: 42%; left: 12%; --fd: 2.8s; }
:root[data-theme='summer'] .summer-firefly:nth-child(2)  { width: 5px; height: 5px;  bottom: 32%; left: 18%; --fd: 3.5s; animation-delay: 0.5s; }
:root[data-theme='summer'] .summer-firefly:nth-child(3)  { width: 7px; height: 7px;  bottom: 52%; left: 28%; --fd: 2.2s; animation-delay: 1s; box-shadow: 0 0 12px rgba(245,197,66,0.7), 0 0 28px rgba(245,197,66,0.25); }
:root[data-theme='summer'] .summer-firefly:nth-child(4)  { width: 4px; height: 4px;  bottom: 24%; left: 36%; --fd: 3.2s; animation-delay: 0.3s; }
:root[data-theme='summer'] .summer-firefly:nth-child(5)  { width: 6px; height: 6px;  bottom: 55%; left: 48%; --fd: 2.5s; animation-delay: 1.5s; }
:root[data-theme='summer'] .summer-firefly:nth-child(6)  { width: 5px; height: 5px;  bottom: 38%; left: 56%; --fd: 3.8s; animation-delay: 0.8s; }
:root[data-theme='summer'] .summer-firefly:nth-child(7)  { width: 4px; height: 4px;  bottom: 60%; left: 42%; --fd: 2.1s; animation-delay: 2s; }
:root[data-theme='summer'] .summer-firefly:nth-child(8)  { width: 5px; height: 5px;  bottom: 20%; left: 70%; --fd: 3s;   animation-delay: 0.2s; }
:root[data-theme='summer'] .summer-firefly:nth-child(9)  { width: 6px; height: 6px;  bottom: 48%; left: 74%; --fd: 2.6s; animation-delay: 1.2s; }
:root[data-theme='summer'] .summer-firefly:nth-child(10) { width: 4px; height: 4px;  bottom: 40%; left: 82%; --fd: 3.4s; animation-delay: 0.6s; }
:root[data-theme='summer'] .summer-firefly:nth-child(11) { width: 5px; height: 5px;  bottom: 62%; left: 15%; --fd: 2.9s; animation-delay: 0.4s; }
:root[data-theme='summer'] .summer-firefly:nth-child(12) { width: 6px; height: 6px;  bottom: 30%; left: 64%; --fd: 3.1s; animation-delay: 1.8s; }

@keyframes summer-flicker {
  0%   { opacity: 0.05; transform: scale(0.4); }
  25%  { opacity: 0.9;  transform: scale(1.15); }
  45%  { opacity: 0.15; transform: scale(0.6); }
  65%  { opacity: 1;    transform: scale(1); }
  85%  { opacity: 0.3;  transform: scale(0.7); }
  100% { opacity: 0.05; transform: scale(0.3); }
}
```

- [ ] **Step 3: Update `prefers-reduced-motion` block**

Add to the existing `@media (prefers-reduced-motion: reduce)` block at the end:
```css
  :root[data-theme='summer'] .summer-firefly,
  :root[data-theme='summer'] .summer-star {
    display: none;
  }
```

- [ ] **Step 4: Verify**

```bash
npm run build
```
Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add public/styles.css
git commit -m "feat(theme): add summer color palette and scene CSS"
```

---

### Task 3: Add summer scene HTML to BaseLayout

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: CSS classes defined in Task 2
- Produces: rendered scene behind page content

- [ ] **Step 1: Add summer scene HTML after the spring petals div**

After line 107 (`</div>` closing spring-petals), add:
```astro
    <!-- Summer Theme: Night Sky, Bamboo, Fireflies -->
    <div class="summer-scene" aria-hidden="true">
      <div class="summer-moon-glow"></div>
      <div class="summer-moon"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-star"></div>
      <div class="summer-bamboo">
        <div class="summer-cluster summer-cluster-1">
          <div class="summer-stalk s1"></div>
          <div class="summer-stalk s2"></div>
          <div class="summer-stalk s3"></div>
          <div class="summer-stalk s4"></div>
        </div>
        <div class="summer-cluster summer-cluster-2">
          <div class="summer-stalk s1"></div>
          <div class="summer-stalk s2"></div>
          <div class="summer-stalk s3"></div>
          <div class="summer-stalk s4"></div>
          <div class="summer-stalk s5"></div>
        </div>
        <div class="summer-cluster summer-cluster-3">
          <div class="summer-stalk s1"></div>
          <div class="summer-stalk s2"></div>
          <div class="summer-stalk s3"></div>
        </div>
        <div class="summer-cluster summer-cluster-4">
          <div class="summer-stalk s1"></div>
          <div class="summer-stalk s2"></div>
          <div class="summer-stalk s3"></div>
          <div class="summer-stalk s4"></div>
          <div class="summer-stalk s5"></div>
        </div>
        <div class="summer-cluster summer-cluster-5">
          <div class="summer-stalk s1"></div>
          <div class="summer-stalk s2"></div>
          <div class="summer-stalk s3"></div>
        </div>
      </div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-firefly"></div>
      <div class="summer-ground"></div>
    </div>
```

- [ ] **Step 2: Verify**

```bash
npm run build
```
Expected: build passes.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(theme): add summer scene HTML to layout"
```
