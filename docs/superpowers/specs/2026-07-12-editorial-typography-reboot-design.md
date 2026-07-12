# Editorial Typography Reboot — 排版重生设计文档

> 2026-07-12 | 从第一性原理出发的排版/布局/字体全面改造

## 目标

将站点从"功能可用"的排版提升到"Editorial 杂志感"的排版，参考 A24 / 杂志社编辑风格，通过字号体系、字重层级、留白节奏、栏宽策略、首页布局和字体选择六个维度的改造，实现排版"重生"。

## 设计原则

- **最小侵入**：CSS Custom Properties 驱动，不改 HTML 结构
- **向后兼容**：现有内容（Writing/Now 的 Markdown）无需修改
- **主题无影响**：6 套季节主题的颜色系统不变，只改排版层
- **纯 CSS 驱动**：不改 HTML 标记结构（Markdown 内容）和 JS 逻辑。现有 PretextEnhancer (CJK 行高引擎) 保持不变。

---

## 1. 字体 (Font)

**选择：Plus Jakarta Sans**

| 维度 | 旧 | 新 |
|------|-----|-----|
| 字体 | Space Grotesk (全站) | Plus Jakarta Sans (全站) |
| 来源 | Google Fonts | Google Fonts |
| 字重 | 300, 400, 500, 600, 700 | 300, 400, 500, 600, 700 |
| 加载 | 已加载 | 替换 `<link>` URL |

**理由**：Plus Jakarta Sans 介于"有个性"和"好阅读"之间。几何骨架但字母形状规矩（不像 Space Grotesk 过于 quirky），7 字重覆盖全场景，中英混排友好。气质接近有设计品味的互联网公司官网。

### 实施

`src/layouts/BaseLayout.astro` 中替换 Google Fonts 链接：

```
旧: https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap
新: https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap
```

`src/styles/typography-engine.css` 中替换 font stacks：

```css
--font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont,
  'Segoe UI', Roboto, 'Noto Sans SC', 'PingFang SC',
  'Microsoft YaHei', sans-serif;
```

PretextEnhancer 中字体检测也相应更新。

---

## 2. 字号体系 (Type Scale)

从 Major Third (1.25) 改为自定义 Editorial Scale，加大标题/正文比例落差。

| Token | 旧 (min→max) | 新 (min→max) | 用途 |
|-------|-------------|-------------|------|
| `--fs-xs` | 10→11.5px | 10→11px | Badges |
| `--fs-sm` | 12.8→14px | 12→14px | Meta / Caption |
| `--fs-base` | 15→17.3px | 16→18px | 正文 |
| `--fs-md` | 17→20px | 18→24px | h4 / 导语 |
| `--fs-lg` | 20→25px | 24→32px | h3 |
| `--fs-xl` | 23→31px | 32→44px | h2 |
| `--fs-2xl` | 26→39px | 44→60px | 文章标题 |
| `--fs-3xl` | 28.8→49px | 60→88px | 首页 H1 |

**关键变化**：
- 正文从 15→17.3px 升至 16→18px（比原来大）
- 标题全体上移约 50-80%（h2 从 31px→44px，文章标题从 39px→60px）
- 桌面端文章标题/正文比例从 2.3x 升至 3.3x

### 实施

修改 `src/styles/typography-engine.css` 中 `--fs-*` 变量。fluid clamp 值需精确计算（375px→1200px 区间）。

---

## 3. 字重层级 (Weight Hierarchy)

从扁平字重（全 400）改为有明确对比的层级。

| 元素 | 旧 | 新 |
|------|-----|-----|
| 正文 (body) | 400 | 400 (Regular) |
| Meta / Caption | 400 | 400 |
| h4 / 导语 | 400 | 500 (Medium) |
| h3 | 400 | 600 (SemiBold) |
| h2 | 600 | 700 (Bold) |
| 文章标题 (h1) | 400 | 700 (Bold) |
| 导航链接 | 400 | 500 (Medium) |

**注意**：因 Plus Jakarta Sans 的 Regular (400) 比 Space Grotesk 视觉上略轻，正文不再降到 300，保持 400 即可获得轻盈但清晰的效果。

### 实施

`src/styles/article.css` 和各组件中 `font-weight` 按上表修改。

---

## 4. 垂直节奏 / 间距 (Vertical Rhythm)

| Token | 旧 | 新 | 用途 |
|-------|-----|-----|------|
| `--space-list-item` | 0.35em | 0.4em | 列表项间隙 |
| `--space-prose` | 1.25em | 1.5em | 段落间距 |
| `--space-heading-below` | 0.5em | 0.75em | 标题下间距 |
| `--space-block` | 1.5em | 2em | 代码块/引用块间距 |
| `--space-heading-above` | 2em | 3em | 标题上间距 |
| `--space-section` (新) | — | 4em | 文章内部大段间隔 |
| `main` gap | 70px | 96px | 页面级 section 间距 |

### 实施

`src/styles/typography-engine.css` 中修改 spacing token。`BaseLayout.astro` 或 `theme-components.css` 中修改 `main` gap。

---

## 5. 内容栏宽 + Full-Bleed

**正文栏宽**：`max-width: 640px; margin-inline: auto;`（640px = 40rem，最佳中文阅读宽度）

**Full-Bleed 元素**（代码块、图片、图示）：背景带横跨容器全宽，内容左对齐正文栏宽。

CSS 实现：
```css
.post-content {
  max-width: 40rem;
  margin-inline: auto;
}

/* Full-bleed: 背景全宽，内容对齐正文 */
.post-content pre,
.post-content .bleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  padding: 24px calc(50vw - 50%);
}
```

**TOC 侧栏**：从右侧 220px 移到左侧，布局从 `正文 | TOC` 变为 `TOC | 正文`，更符中文阅读流。

### 实施

- `src/styles/article.css`：添加 `.post-content { max-width: 40rem; margin-inline: auto; }`
- Full-bleed 逻辑放在 `responsive-v2.css`
- TOC 布局改为 `grid-template-columns: 220px minmax(0, 1fr)`

---

## 6. 文章页 — 封面式文章头

将当前简单的标题+Meta 布局改为封面式头：

```
[Label: Writing · Essay]
[超大标题 h1, 38px+ Bold]
[导语 description, 13px, light]
────────────────── (1px 分隔线)
[日期 · 阅读时长 · 标签]
```

### 实施

修改 `src/pages/writing/[slug].astro` 和 `src/pages/now/[slug].astro` 的文章头模板。样式加在 `src/styles/article.css`。

---

## 7. 文章页 — Pull Quote (引用提取)

升级现有 blockquote 样式：

- 大尺寸半透明引号水印（`"` Unicode `\201C`，4.5em，opacity 0.1）
- 粗体文字 (500 weight)
- 主题色左边框
- 微背景色
- 圆角右边

向后兼容：所有 Markdown `>` 引用自动升级。

### 实施

修改 `src/styles/article.css` 中 `blockquote` 样式。

---

## 8. 首页杂志化

从紧凑卡片列表改为 Editorial 栏目化布局：

```
[Hero: 小标签 + 大标题 + 介绍]
───────── 96px gap ─────────
[封面文章: 特色文章卡片，有封面图 + 大字标题]
───────── 96px gap ─────────
[Writing: 2 栏卡片 grid]
───────── 96px gap ─────────
[Now: 轻量列表]
───────── 96px gap ─────────
[工具 · 项目]
────── Vibe Mosaic ──────
```

### 实施

修改 `src/pages/index.astro`，首页 HTML 结构和 inline style 均需调整。

---

## 9. 导航微调

- 移除头部的底部分割线（`border-bottom`）
- 导航链接字重 500 Medium
- 整体更透气

### 实施

`src/components/theme/SiteHeader.astro` 或 `theme-components.css`。

---

## 不受影响的模块

- 6 套季节主题的颜色/动画系统
- CJK/Latin 混排行高引擎 (PretextEnhancer)
- Container Query 响应式断点
- Pagefind 搜索
- Footer Gallery / Vibe Mosaic
- View Transitions 主题切换动画

---

## 实施顺序

1. **字体替换**（Plus Jakarta Sans 加载 + font stacks）
2. **Type Scale**（typography-engine.css 变量）
3. **字重层级**（各处 font-weight）
4. **间距系统**（spacing tokens）
5. **内容栏宽**（max-width + full-bleed）
6. **文章页改造**（封面式头 + Pull Quote + TOC 左侧化）
7. **首页改造**（封面文章 + 栏目化布局）
8. **导航微调**（去分割线 + 字重）

每步完成后 `npm run build` 验证。
