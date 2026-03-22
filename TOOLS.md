# TOOLS.md - JingkaiTang.github.io 项目 SOP

> **项目信息**
> - 仓库：https://github.com/JingkaiTang/JingkaiTang.github.io
> - 类型：Astro 博客（非 Hexo！）| 部署：GitHub Pages
> - 路径：`~/workspace/JingkaiTang.github.io/`

## 常用命令速查

```bash
npm run new:post                    # 新建文章
npm run new:now                     # 新建 Now
npm run dev:watch                   # 本地预览（监听）
npm run publish:writing:draft       # 草稿发布
npm run publish:writing:confirm     # 正式发布（自动 draft:false）
npm run publish:writing:final       # 最终发布（已手动 draft:false）
npm run publish:now                 # 发布 Now
npm run validate:publish            # 发布前校验
npm run compress:images             # 图片压缩
npm run preview:lan                 # 显示局域网预览地址
```

---

## 📝 Writing 发布流程

### 流程概览
```
new:post → 内容整理 → dev:watch 预览 → publish:writing:draft → 主人确认 → publish:writing:confirm → (可选) 公众号同步
```

### 详细步骤

**1. 创建骨架**
```bash
npm run new:post  # 回答 prompts：标题、slug、tags 等
```
产出：`src/content/writing/<slug>/index.md`

**2. 内容整理**
- 从 Obsidian 复制内容到文章文件
- 图片放同目录，用相对路径 `![](./xxx.png)`
- 单张 >500KB 自动压缩

**3. 本地预览（必须！）**
```bash
npm run dev:watch
```
- 局域网：发 LAN 地址给主人确认
- 非局域网：本地截图确认

**4. 草稿发布**
```bash
npm run publish:writing:draft -- --slug <slug>
```
- 保留 `draft: true`，推送到 main

**5. 主人确认** → **6. 正式发布**
```bash
npm run publish:writing:confirm -- --slug <slug>  # 自动改 draft: false
```

**7. 公众号同步（可选）**
```bash
# 博客正式发布后，运行
/home/t7kai/.openclaw/workspace-JingkaiTang.github.io/skills/wechat-publisher/scripts/publish.sh src/content/writing/<slug>/index.md
```

---

## ⚡ Now 发布流程
```bash
npm run new:now
npm run publish:now -- --slug <slug>  # 直接发布，无草稿阶段
```

---

## ⚠️ 关键规则

| 规则 | 说明 |
|------|------|
| ❌ **不需要新建分支** | Writing/Now 都直接走 main |
| ✅ **必须本地预览** | 草稿发布前确保排版正常 |
| 📁 **图片相对路径** | 从文章文件所在目录计算 |
| 🔄 **先博客后微信** | 博客正式发布后再同步公众号 |
| 🎯 **slug 唯一** | 不能与已有文章重复 |

---

## 🛠️ 故障排查

### 发布前校验
```bash
npm run validate:publish  # 检查 draft/title/cover/图片路径
```

### 图片压缩
```bash
npm run compress:images -- --dry-run  # 预览要压缩的图片
```

### 预览地址
```bash
npm run preview:lan  # 显示本地和局域网地址
```
