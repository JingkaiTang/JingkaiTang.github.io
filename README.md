# JingkaiTang.github.io

个人站点（Astro + GitHub Pages + Pagefind）。

## 运行环境

- Node.js `20.x`
- npm `10.x`

## 本地开发

```bash
npm install
npm run dev
```

说明：
- `npm run dev` 前会自动同步资源，并生成一次 Pagefind 开发索引（由 `predev` 触发）。
- 修改内容后如需刷新搜索索引，重启 `npm run dev` 或手动运行 `npm run search:dev`。
- 如需开发时监听内容目录并自动同步资源，可用 `npm run dev:watch`。

## 构建与预览

```bash
npm run build
npm run preview
```

说明：
- `npm run build` 前会自动执行 `sync:assets`（由 `prebuild` 触发）。
- `build` 流程包含：拉取 GitHub Pins、构建 footer gallery、`astro build`、Pagefind 索引生成（`dist/pagefind/`）。

## 主要命令

```bash
# 新建内容
npm run new:post
npm run new:now

# 编辑内容（自动写入 updatedDate）
npm run edit:writing -- --slug <writing-slug>
npm run edit:now -- --slug <now-slug>

# 同步资源
npm run sync:assets

# 质量检查
npm run check
npm run audit:size

# 部署追赶（必要时触发 pages workflow_dispatch）
npm run deploy:ensure
```

## 发布流程（当前）

Writing（长文）：
- 草稿发布（保持 `draft:true`）：`npm run publish:writing:draft -- --slug <slug>`
- 确认发布（自动 `draft:true -> draft:false`）：`npm run publish:writing:confirm -- --slug <slug>`
- 手动发布（你先改成 `draft:false`）：`npm run publish:writing:final -- --slug <slug>`

Now（短更新）：
- 直接发布：`npm run publish:now -- --slug <slug>`

补充：
- `npm run publish:writing` 已废弃，仅提示改用上述新命令。
- 发布脚本默认走 `main` 直推，并使用 SSH over 443：`ssh://git@ssh.github.com:443/JingkaiTang/JingkaiTang.github.io.git`。

## 内容结构

Writing：
- 目录：`src/content/writing/<slug>/index.md`
- URL：`/writing/<slug>/`

Now：
- 目录：`src/content/now/<id>/index.md`
- `<id>` 默认格式：`YYYYMMDDHHmmss`（Asia/Shanghai）
- URL：`/now/<id>/`
- tags 必含 `now`

Tags：
- `/tags` 与 `/tags/<tag>` 聚合 `writing + now`

## 文章资源约定

推荐文章与资源同目录：

```text
src/content/writing/
  <slug>/
    index.md
    cover.jpg
    arch.png
```

Markdown 中使用相对路径：

```md
![cover](cover.jpg)
![arch](arch.png)
```

构建/开发时会自动：
- 同步到 `public/{writing,now}/...`
- 通过 remark 插件把相对链接改写为站点绝对路径（不修改源文件）

## 主题系统

当前主题：
- `🤖 科技`（`tech`）
- `☀️ 白天`（`day`）
- `🌙 黑夜`（`night`）
- `🧧 新春`（`cny`）

默认主题：
- 在 `src/theme/config.ts` 的 `DEFAULT_THEME` 配置
- 当前默认：`cny`
- 用户在浏览器切换后会持久化到 `localStorage`（key: `site-theme`）

## 部署

- GitHub Actions 自动构建并部署到 GitHub Pages。
