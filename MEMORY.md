# MEMORY.md - Long-Term Memory

> Identity/Preferences: SOUL.md + USER.md | Automation: AGENTS.md + HEARTBEAT.md

## 🎯 Current Focus
- 维护个人 GitHub Pages 主页项目：JingkaiTang.github.io

## ⚙️ Important Config

### Telegram Topic 格式（易踩坑）
- **正确：** `-1003541585949:topic:18`（必须包含 `:topic:` 前缀）
- **错误：** `-1003541585949`（会发送到群组主话题，不是 topic 18）
- **配置位置：** `~/.openclaw/openclaw.json` → `agents.list[].heartbeat.to`
- **心跳间隔：** 30 分钟（`every: 30m`）

## 🐛 Lessons Learned

### PR #88 - 草稿文章导航问题
- **问题：** 草稿文章出现在上一篇/下一篇导航中
- **修复：** 在 `getStaticPaths` 中过滤草稿，使用 Map 优化性能
- **教训：** prev/next 逻辑必须过滤 `draft: true` 的文章

### 2026-03-22 - 发布流程踩坑
- **预览服务器：** 用 `preview:lan` 而非 `dev:watch`，确保绑定 LAN 地址
- **端口清理：** 发布前先 `pkill -f "astro"` 清理残留进程
- **图片处理：** 封面图只放 frontmatter，不混入文章内容；文章图片单独复制
- **标题重复：** 内容中不写 `# 标题`，Astro 自动使用 frontmatter 的 title
- **域名：** GitHub Pages 域名是 `jingkaitang.github.io`，不是 `jingkaitang.com`
