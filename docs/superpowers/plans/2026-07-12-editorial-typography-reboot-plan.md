# Editorial Typography Reboot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the site's typography and layout system with an editorial magazine aesthetic — Plus Jakarta Sans font, dramatic type scale, generous spacing, 640px content column with full-bleed elements, cover-style article headers, pull quotes, and a magazine-layout homepage.

**Architecture:** CSS Custom Properties-driven — modify CSS variables in typography-engine.css for the type scale and spacing, update article.css for content layout and blockquote styling, restructure Astro templates for article and homepage HTML. No new dependencies, no JS changes beyond a font stack string update in PretextEnhancer.

**Tech Stack:** Astro 6.0.8, custom CSS (no framework), Google Fonts (Plus Jakarta Sans replaces Space Grotesk)

## Global Constraints

- All existing content (Writing/Now markdown) must remain unchanged
- 6 seasonal theme color systems untouched
- CJK/Latin line-height engine (PretextEnhancer) keeps working
- Container Query responsive breakpoints preserved
- Pagefind search, Footer Gallery, View Transitions unaffected
- `npm run build` must pass after each task
- Follow AGENTS.md project conventions

---

### Task 1: Font Replacement — Plus Jakarta Sans

**Files:**
- Modify: `src/layouts/BaseLayout.astro:84-86`
- Modify: `src/styles/typography-engine.css:9-14`
- Modify: `src/components/PretextEnhancer.astro:225`

**Interfaces:**
- Produces: `--font-display` and `--font-body` now reference `'Plus Jakarta Sans'` instead of `'Space Grotesk'`

- [ ] **Step 1: Update Google Fonts link in BaseLayout**

Replace the Space Grotesk `<link>` on lines 84-86 of `src/layouts/BaseLayout.astro`:

```html
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
    />
```

- [ ] **Step 2: Update font stacks in typography-engine.css**

Replace lines 9-14 of `src/styles/typography-engine.css`:

```css
  --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Noto Sans SC', 'PingFang SC',
    'Microsoft YaHei', sans-serif;
```

- [ ] **Step 3: Update font check in PretextEnhancer**

Replace line 225 of `src/components/PretextEnhancer.astro`:

```js
  const fontReady = document.fonts.check('1em "Plus Jakarta Sans"')
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds. Font loads as Plus Jakarta Sans on all pages.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro src/styles/typography-engine.css src/components/PretextEnhancer.astro
git commit -m "feat: replace Space Grotesk with Plus Jakarta Sans"
```

---

### Task 2: Editorial Type Scale

**Files:**
- Modify: `src/styles/typography-engine.css:22-29`

**Interfaces:**
- Produces: New `--fs-xs` through `--fs-3xl` clamp values for the editorial scale

- [ ] **Step 1: Replace type scale CSS variables**

Replace lines 22-29 of `src/styles/typography-engine.css` with the new editorial scale:

```css
  --fs-xs:   clamp(0.625rem, 0.60rem + 0.10vw,  0.688rem);  /* 10px → 11px */
  --fs-sm:   clamp(0.75rem,  0.71rem + 0.15vw,  0.875rem);  /* 12px → 14px */
  --fs-base: clamp(1rem,     0.95rem + 0.15vw,  1.125rem);  /* 16px → 18px */
  --fs-md:   clamp(1.125rem, 1.04rem + 0.35vw,  1.5rem);    /* 18px → 24px */
  --fs-lg:   clamp(1.5rem,   1.38rem + 0.50vw,  2rem);      /* 24px → 32px */
  --fs-xl:   clamp(2rem,     1.80rem + 0.80vw,  2.75rem);   /* 32px → 44px */
  --fs-2xl:  clamp(2.75rem,  2.40rem + 1.20vw,  3.75rem);   /* 44px → 60px */
  --fs-3xl:  clamp(3.75rem,  3.30rem + 1.70vw,  5.5rem);    /* 60px → 88px */
```

- [ ] **Step 2: Build and check visual output**

Run: `npm run build`
Expected: Build succeeds. Headings are visibly larger, body text (16→18px) slightly larger than before.

- [ ] **Step 3: Commit**

```bash
git add src/styles/typography-engine.css
git commit -m "feat: replace Major Third type scale with Editorial Scale"
```

---

### Task 3: Weight Hierarchy + Line Height Adjustments

**Files:**
- Modify: `src/styles/article.css:17-20,70-89`
- Modify: `src/styles/article.css:33-36` (post-content base)
- Modify: `src/styles/typography-engine.css:32-42` (line heights)

**Interfaces:**
- Consumes: New type scale from Task 2
- Produces: Clear font-weight contrast (400 body / 500 h4 / 600 h3 / 700 h2,h1)

- [ ] **Step 1: Update line-height tokens for editorial feel**

In `src/styles/typography-engine.css`, update lines 32-42:

```css
  --lh-tight:      1.15;   /* headings */
  --lh-body:       1.85;   /* Latin-dominant body */
  --lh-body-cjk:   1.95;   /* CJK-dominant body */
  --lh-body-mixed: 1.88;   /* mixed CJK/Latin */
  --lh-loose:      2.0;    /* blockquotes, captions */
  --lh-code:       1.6;    /* code blocks */

  --lh-body-cjk-compact:   1.88;
  --lh-body-mixed-compact: 1.82;
```

- [ ] **Step 2: Add font-weight to post title**

In `src/styles/article.css`, modify the `.post-title` block (lines 17-20):

```css
.post-title {
  font-size: var(--fs-2xl);
  line-height: var(--lh-tight);
  font-weight: 700;
  letter-spacing: -0.01em;
}
```

- [ ] **Step 3: Update heading font-weights**

In `src/styles/article.css`, modify lines 70-89:

```css
.post-content :is(h2, h3, h4) {
  margin-top: var(--space-heading-above);
  margin-bottom: var(--space-heading-below);
  line-height: var(--lh-tight);
  letter-spacing: -0.01em;
}

.post-content h2 {
  font-size: var(--fs-xl);
  font-weight: 700;
}

.post-content h3 {
  font-size: var(--fs-lg);
  color: var(--text-strong);
  font-weight: 600;
}

.post-content h4 {
  font-size: var(--fs-md);
  color: var(--text-strong);
  font-weight: 500;
}
```

- [ ] **Step 4: Update post content body styling**

In `src/styles/article.css`, update the `.post-content` base (lines 39-43):

```css
.post-content {
  margin-top: 22px;
  color: var(--text);
  font-size: var(--fs-base);
  line-height: var(--lh-body);
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
  overflow-wrap: anywhere;
  container-type: inline-size;
  container-name: article;
}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: Build succeeds. Headings now bold, body text has proper weight contrast.

- [ ] **Step 6: Commit**

```bash
git add src/styles/typography-engine.css src/styles/article.css
git commit -m "feat: apply editorial weight hierarchy and line heights"
```

---

### Task 4: Spacing System — Generous Whitespace

**Files:**
- Modify: `src/styles/typography-engine.css:45-53`
- Modify: `src/styles/theme-components.css:5-7` (main gap)

**Interfaces:**
- Consumes: Type scale from Task 2
- Produces: Larger spacing tokens, 96px main gap

- [ ] **Step 1: Update spacing tokens**

In `src/styles/typography-engine.css`, replace lines 45-53:

```css
  --space-prose:         1.5em;
  --space-heading-above: 3em;
  --space-heading-below: 0.75em;
  --space-list-item:     0.4em;
  --space-block:         2em;
```

- [ ] **Step 2: Update main section gap**

In `src/styles/theme-components.css`, modify lines 5-7:

```css
main {
  padding-top: 0;
  gap: 96px;
}
```

Already-existing explicit `padding: 0 8vw 80px` on `main` from another stylesheet — ensure `gap: 96px` is not overridden.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Build succeeds. Paragraphs and headings now have more breathing room.

- [ ] **Step 4: Commit**

```bash
git add src/styles/typography-engine.css src/styles/theme-components.css
git commit -m "feat: apply generous editorial spacing system"
```

---

### Task 5: Content Width + Full-Bleed + TOC Left

**Files:**
- Modify: `src/styles/article.css:7-14` (post-shell grid)
- Modify: `src/styles/article.css:39-56` (post-content + bleed CSS)
- Modify: `src/styles/article.css:108-121` (blockquote — pull quote prep)
- Modify: `src/styles/responsive-v2.css:28-65` (TOC responsive)

**Interfaces:**
- Consumes: Spacing from Task 4
- Produces: `.post-content { max-width: 40rem; margin-inline: auto; }`, full-bleed code/images, TOC on left

- [ ] **Step 1: Center post-content with max-width**

In `src/styles/article.css`, add to the `.post-content` block (after line 51):

```css
.post-content {
  /* ... existing ... */
  max-width: 40rem;
  margin-inline: auto;
}
```

- [ ] **Step 2: Add full-bleed CSS for pre and images**

Add after the `.post-content` block in `src/styles/article.css`:

```css
/* Full-bleed: background spans full width, content aligns with body column */
.post-content pre {
  width: 100vw;
  max-width: none;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  border-radius: 0;
  border-left: none;
  border-right: none;
  padding: 24px calc(50vw - 50% + 20px);
  box-sizing: border-box;
}

.post-content img {
  max-width: min(100%, calc(100vw - 4rem));
  margin-left: auto;
  margin-right: auto;
}
```

- [ ] **Step 3: Move TOC to the left side**

In `src/styles/article.css`, change the `.post-shell` grid (lines 7-14):

```css
.post-shell {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 32px;
  align-items: start;
  max-width: 100%;
  box-sizing: border-box;
}
```

- [ ] **Step 4: Update TOC responsive collapse for new left position**

In `src/styles/responsive-v2.css`, update the TOC section within `@media (max-width: 900px)` (lines 33-53) to keep the collapsed behavior working:

```css
  .post-shell {
    grid-template-columns: 1fr;
  }
```

This line at 29-31 already handles this correctly. Verify no changes needed.

- [ ] **Step 5: Adjust responsive full-bleed for mobile**

In `src/styles/responsive-v2.css`, inside `@container article (max-width: 640px)` and `@supports not (container-type: inline-size)`, update the `pre` rule to cancel full-bleed on small screens:

Replace line 281-288:
```css
  & pre {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
    border-radius: 12px;
    border: 1px solid var(--code-border);
    padding: 12px 14px;
    font-size: var(--fs-sm);
  }
```

And the `@supports` fallback at line 486-493 similarly:
```css
    .post-content pre {
      width: 100%;
      max-width: 100%;
      margin-left: 0;
      margin-right: 0;
      border-radius: 12px;
      border: 1px solid var(--code-border);
      padding: 12px 14px;
    }
```

- [ ] **Step 6: Build and verify layout**

Run: `npm run build`
Expected: Build succeeds. Content column centered at 640px. Code blocks bleed full width. TOC on left side.

- [ ] **Step 7: Commit**

```bash
git add src/styles/article.css src/styles/responsive-v2.css
git commit -m "feat: add 640px content column, full-bleed code, left-side TOC"
```

---

### Task 6: Article Page — Cover Header + Pull Quote

**Files:**
- Modify: `src/pages/writing/[slug].astro:62-97` (article header)
- Modify: `src/pages/now/[slug].astro:32-66` (article header)
- Modify: `src/styles/article.css:108-121` (blockquote pull quote styling)

**Interfaces:**
- Consumes: Type scale (Task 2), spacing (Task 4), content column (Task 5)
- Produces: Cover-style header with label + large title + subtitle + meta divider; enhanced blockquote with quote watermark

- [ ] **Step 1: Redesign Writing article header**

Replace lines 62-97 of `src/pages/writing/[slug].astro`:

```astro
  <section class="section glass post-article">
    <div class="post-shell">
      <article class="post">
        <header class="post-cover-header">
          <div class="post-cover-label">Writing</div>
          <h1 class="post-title post-title-plain">{post.data.title}</h1>
          {post.data.description ? (
            <p class="post-cover-subtitle">{post.data.description}</p>
          ) : null}
          {isDraft ? (
            <span class="post-draft-badge">草稿</span>
          ) : null}
          <div class="post-cover-meta">
            {formatShanghai(post.data.pubDate, { withSeconds: true })}
            {post.data.updatedDate ? (
              <>
                {' '}· 更新于 {formatShanghai(post.data.updatedDate, { withSeconds: true })}
              </>
            ) : null}
            <> · {words} 字 · 约 {minutes} 分钟阅读</>
            {post.data.tags.length ? (
              <> · {post.data.tags.map((t, i) => (
                <>
                  <a href={`/tags/${encodeURIComponent(t)}/`}>{t}</a>
                  {i < post.data.tags.length - 1 ? ' / ' : ''}
                </>
              ))}</>
            ) : null}
          </div>
        </header>

        <div class="post-content">
          <Content />
        </div>
```

Remove the old `post-draft-note` paragraph and simplify. Keep the prev/next nav unchanged.

- [ ] **Step 2: Add cover header CSS**

In `src/styles/article.css`, add after the existing `.post-meta` block:

```css
/* ── Cover Header ── */
.post-cover-header {
  padding: 0 0 28px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 32px;
}

.post-cover-label {
  font-size: var(--fs-xs);
  color: var(--primary);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.post-cover-subtitle {
  font-size: var(--fs-md);
  color: var(--muted);
  font-weight: 300;
  line-height: 1.6;
  margin: 0 0 20px;
  max-width: 480px;
}

.post-cover-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 10px;
  font-size: var(--fs-sm);
  color: var(--muted);
  padding-top: 18px;
}

.post-cover-meta a {
  color: var(--muted);
  text-decoration: none;
}

.post-cover-meta a:hover {
  color: var(--primary);
}
```

- [ ] **Step 3: Redesign Now article header similarly**

Replace lines 32-66 of `src/pages/now/[slug].astro`:

```astro
  <section class="section glass post-article">
    <article class="post">
      <header class="post-cover-header">
        <div class="post-cover-label">Now</div>
        <h1 class="post-title post-title-plain">{post.data.title}</h1>
        {post.data.description ? (
          <p class="post-cover-subtitle">{post.data.description}</p>
        ) : null}
        {isDraft ? (
          <span class="post-draft-badge">草稿</span>
        ) : null}
        <div class="post-cover-meta">
          {formatShanghai(post.data.pubDate, { withSeconds: true })}
          {post.data.updatedDate ? (
            <>
              {' '}· 更新于 {formatShanghai(post.data.updatedDate, { withSeconds: true })}
            </>
          ) : null}
          {post.data.tags.length ? (
            <> · {post.data.tags.map((t, i) => (
              <>
                <a href={`/tags/${encodeURIComponent(t)}/`}>{t}</a>
                {i < post.data.tags.length - 1 ? ' / ' : ''}
              </>
            ))}</>
          ) : null}
        </div>
      </header>

      <div class="post-content">
        <Content />
      </div>

      <p class="post-back-link"><a href="/now">← 返回 Now</a></p>
    </article>
  </section>
```

- [ ] **Step 4: Upgrade blockquote to Pull Quote**

Replace lines 108-121 of `src/styles/article.css`:

```css
/* ── Blockquotes / Pull Quotes ── */
.post-content blockquote {
  position: relative;
  border-left: 3px solid var(--primary);
  padding: 1.25em 1.25em 1.25em 1.5em;
  margin: var(--space-block) 0;
  color: var(--text);
  background: var(--blockquote-bg, rgba(124, 249, 255, 0.04));
  border-radius: 0 12px 12px 0;
  font-size: 1.05em;
  font-weight: 500;
  line-height: 1.55;
  overflow: hidden;
}

.post-content blockquote::before {
  content: '\201C';
  font-size: 4.5em;
  position: absolute;
  left: 0.15em;
  top: -0.25em;
  color: var(--primary);
  opacity: 0.1;
  font-family: Georgia, serif;
  line-height: 1;
  pointer-events: none;
}
```

Keep the nested blockquote and child element margin rules (lines 123-136) unchanged.

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds. Article pages show cover-style header, blockquotes have watermark quote mark.

- [ ] **Step 6: Commit**

```bash
git add src/pages/writing/ src/pages/now/ src/styles/article.css
git commit -m "feat: add cover-style article header and pull quote blockquote"
```

---

### Task 7: Homepage Magazine Layout

**Files:**
- Modify: `src/pages/index.astro:27-39` (hero), `41-155` (latest/projects sections)
- Modify: `src/styles/article.css` (add `.section-head` styling)

**Interfaces:**
- Consumes: Type scale (Task 2), spacing (Task 4)
- Produces: Magazine-layout homepage with cover article, 2-column Writing grid, lightweight Now list

- [ ] **Step 1: Redesign hero section**

Replace lines 27-39 of `src/pages/index.astro`:

```astro
  <section class="hero" style="padding-top: 12px;">
    <div class="hero-content">
      <div class="hero-intro">
        <img class="avatar hero-avatar" src="/images/avatar.jpg" alt="唐靖凯" loading="eager" decoding="async" fetchpriority="high" />
        <div class="hero-text">
          <div class="hero-label">Personal Site</div>
          <h1 class="hero-title">我是<span>唐靖凯</span></h1>
          <p class="hero-subtitle">Java + AI 工程师 / 游戏玩家 / 新手奶爸</p>
        </div>
      </div>
    </div>
  </section>
```

Add `.hero-label` styling to the existing inline or global hero CSS:

```css
.hero-label {
  font-size: 0.75rem;
  color: var(--primary);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
```

- [ ] **Step 2: Restructure Latest section to magazine layout**

Replace the "最新" section (lines 41-156) with:

```astro
  {/* Featured Article — first Writing post as cover story */}
  {latestWriting.length > 0 ? (
    <section id="featured" class="section">
      <div class="section-head">
        <div class="section-head-label">Featured</div>
        <h2>封面文章</h2>
      </div>
      {
        (() => {
          const post = latestWriting[0];
          const href = `/writing/${post.id}/`;
          const coverRaw = pickCover(post);
          const cover = coverRaw ? resolveMaybeRelativeUrl(coverRaw, href) : null;
          return (
            <article class="featured-card">
              {cover ? (
                <a href={href} class="featured-card__cover">
                  <img src={cover} alt="" loading="lazy" decoding="async" />
                </a>
              ) : null}
              <div class="featured-card__body">
                <div class="featured-card__label">Writing</div>
                <h3 class="featured-card__title">
                  <a href={href}>{post.data.title}</a>
                </h3>
                {post.data.description ? (
                  <p class="featured-card__desc">{post.data.description}</p>
                ) : null}
                <div class="featured-card__meta">
                  {formatShanghai(post.data.pubDate, { withSeconds: true })}
                  {post.data.tags?.length ? (
                    <> · {post.data.tags.slice(0, 3).map((t, i) => (
                      <><a href={`/tags/${encodeURIComponent(t)}/`}>{t}</a>{i < Math.min(post.data.tags.length, 3) - 1 ? ' / ' : ''}</>
                    ))}</>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })()
      }
    </section>
  ) : null}

  {/* Writing Grid — 2 column cards */}
  <section id="writing-grid" class="section">
    <div class="section-head">
      <h2>Writing</h2>
      <a class="section-head-more" href="/writing/">查看全部 →</a>
    </div>
    <div class="writing-grid">
      {latestWriting.slice(1).map((post) => {
        const href = `/writing/${post.id}/`;
        const coverRaw = pickCover(post);
        const cover = coverRaw ? resolveMaybeRelativeUrl(coverRaw, href) : null;
        return (
          <PostCard
            href={href}
            title={post.data.title}
            description={post.data.description}
            dateText={formatShanghai(post.data.pubDate, { withSeconds: true })}
            tags={post.data.tags}
            cover={cover}
            badge="Writing"
            showReadMore={true}
            ariaLabel={`阅读全文：${post.data.title}`}
          />
        );
      })}
      {latestWriting.length <= 1 ? <p style="color: var(--muted);">还没有更多 Writing 内容。</p> : null}
    </div>
  </section>

  {/* Now — lightweight list */}
  <section id="now-list" class="section">
    <div class="section-head">
      <h2>Now</h2>
      <a class="section-head-more" href="/now/">查看全部 →</a>
    </div>
    <div class="now-list">
      {latestNow.map((post) => {
        const href = `/now/${post.id}/`;
        const title = post.data.title.replace(/^Now:\s*/, '');
        return (
          <a href={href} class="now-list-item">
            <span class="now-list-item__date">{formatShanghai(post.data.pubDate, { withSeconds: true })}</span>
            <span class="now-list-item__title">{title}</span>
          </a>
        );
      })}
      {latestNow.length === 0 ? <p style="color: var(--muted);">还没有 Now 内容。</p> : null}
    </div>
  </section>
```

- [ ] **Step 3: Add magazine layout CSS**

Add the following styles to `src/styles/article.css` (or a new inline `<style>` on the homepage):

```css
/* ── Homepage Magazine Layout ── */

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24px;
}

.section-head h2 {
  font-size: var(--fs-lg);
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}

.section-head-label {
  font-size: var(--fs-xs);
  color: var(--primary);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.section-head-more {
  font-size: var(--fs-sm);
  color: var(--muted);
  text-decoration: none;
  font-weight: 400;
}

.section-head-more:hover {
  color: var(--text);
}

/* Featured Card */
.featured-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 28px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--theme-radius-lg);
  overflow: hidden;
}

.featured-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.featured-card__body {
  padding: 28px 28px 28px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.featured-card__label {
  font-size: var(--fs-xs);
  color: var(--primary);
  letter-spacing: 0.15em;
  margin-bottom: 10px;
}

.featured-card__title {
  font-size: var(--fs-xl);
  font-weight: 700;
  line-height: 1.15;
  margin: 0 0 10px;
}

.featured-card__title a {
  color: var(--text);
  text-decoration: none;
}

.featured-card__title a:hover {
  color: var(--primary);
}

.featured-card__desc {
  font-size: var(--fs-base);
  color: var(--muted);
  line-height: 1.6;
  margin: 0 0 14px;
  font-weight: 300;
}

.featured-card__meta {
  font-size: var(--fs-sm);
  color: var(--muted);
}

.featured-card__meta a {
  color: var(--muted);
  text-decoration: none;
}

.featured-card__meta a:hover {
  color: var(--primary);
}

/* Writing Grid */
.writing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 640px) {
  .writing-grid {
    grid-template-columns: 1fr;
  }

  .featured-card {
    grid-template-columns: 1fr;
  }

  .featured-card__body {
    padding: 20px;
  }
}

/* Now List */
.now-list {
  display: flex;
  flex-direction: column;
}

.now-list-item {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  transition: background 0.15s ease;
}

.now-list-item:hover {
  background: var(--surface);
  margin: 0 -12px;
  padding: 14px 12px;
  border-radius: 8px;
}

.now-list-item__date {
  font-size: var(--fs-sm);
  color: var(--muted);
  white-space: nowrap;
  min-width: 90px;
}

.now-list-item__title {
  font-size: var(--fs-base);
  color: var(--text);
  font-weight: 400;
}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds. Homepage shows cover article, Writing grid, Now list.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/styles/article.css
git commit -m "feat: redesign homepage with magazine editorial layout"
```

---

### Task 8: Navigation Micro-Adjustments

**Files:**
- Modify: `src/styles/theme-components.css:1-3` (header border removal)

**Interfaces:**
- Consumes: Type scale (Task 2)
- Produces: Cleaner, borderless nav header

- [ ] **Step 1: Remove header bottom border, adjust link weight**

In `src/styles/theme-components.css`, modify the `.theme-header` block (lines 1-3):

```css
.theme-header {
  padding-bottom: 24px;
  border-bottom: none;
}
```

- [ ] **Step 2: Ensure nav links use medium weight**

Verify that `.nav-links a` elements have `font-weight: 500`. The weight should cascade from the base body style — if not explicitly set, add to `theme-components.css`:

```css
.nav-links a {
  font-weight: 500;
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Build succeeds. Header has no bottom border, nav links use medium weight.

- [ ] **Step 4: Commit**

```bash
git add src/styles/theme-components.css
git commit -m "feat: clean up nav — remove bottom border, medium weight links"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `npm run build` passes cleanly
- [ ] Homepage shows magazine layout: hero → featured card → writing grid → now list
- [ ] Article pages show cover-style header with label, title, subtitle, meta divider
- [ ] Blockquotes display pull-quote styling with watermark quote
- [ ] Content column is 640px centered, code blocks bleed full width
- [ ] TOC appears on left side of article page
- [ ] Navigation has no bottom border, links are medium weight
- [ ] Font is Plus Jakarta Sans throughout
- [ ] Body text is 16→18px, headings dramatically larger
- [ ] All 6 seasonal themes still work correctly
- [ ] CJK line-height engine still functions
- [ ] Responsive layout works at 900px, 640px, 480px breakpoints
- [ ] Pagefind search still works
- [ ] Footer gallery still displays correctly
