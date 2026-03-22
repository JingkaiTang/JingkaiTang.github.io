# HEARTBEAT.md - JingkaiTang.github.io 项目

> 路径说明：见 AGENTS.md | 项目路径：`~/workspace/JingkaiTang.github.io/`

## 监控任务

### 1. GitHub 检查（每天 09:00）
- Issues / PRs / CI 状态

### 2. 内容检查（每周一）
- `src/content/writing/` 下未发布文章
- `src/content/now/` 更新需求

### 3. 依赖检查（每周日）
- `package.json` 重大更新
- Astro/主题更新

### 4. TODO 自动推进（每次心跳）→ **核心机制**

**触发：** Agent 空闲 + TODO.md 有未完成项（`[ ]` 或 `[~]`）

**执行：**
- 优先级：P0 → P1 → P2 → P3
- 每次心跳只推进 1 项
- **流程：严格遵循 AGENTS.md "TODO 自动推进"章节**
- **禁止直接修改 TODO.md** — PR 合并后才能勾选

**跳过：** 主人明确暂停 / 进行中任务 / 需要主人确认

---

**Heartbeat Prompt 指令：**
```
Read HEARTBEAT.md. Check TODO.md for pending items. 
If Agent is idle + TODOs exist → start auto-push workflow from AGENTS.md.
If nothing needs attention → reply HEARTBEAT_OK.
```
