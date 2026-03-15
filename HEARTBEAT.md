# HEARTBEAT.md - JingkaiTang.github.io 项目

## 项目监控任务

### 1. GitHub 仓库检查（每天 09:00）
- 检查 `JingkaiTang/JingkaiTang.github.io` 仓库
- 查看是否有新的 Issues 或 PRs
- 检查 CI/CD 状态

### 2. 内容更新提醒（每周一）
- 检查 `source/posts/` 下是否有未发布的文章
- 检查 `source/now.md` 是否需要更新

### 3. 依赖更新检查（每周日）
- 检查 `package.json` 依赖是否有重大更新
- 检查 Hexo 主题更新

### 4. TODO 自动推进（每次心跳）
**触发条件：**
- Agent 未在执行任务中（空闲状态）
- TODO.md 中存在未完成项（`[ ]` 或 `[~]`）

**执行原则：**
- 按优先级顺序执行（P0 > P1 > P2 > P3）
- 同一优先级按列表顺序执行
- 每次心跳只推进 1 个 TODO 项
- 遵循 AGENTS.md 定义的完整工作流（分支 → 实现 → PR → review → 合并 → 更新 TODO）

**跳过情况：**
- 主人明确要求暂停
- 当前有进行中的任务（session 活跃）
- TODO 项需要主人确认（如发布流程）

---

**注意：** 遵循项目 `AGENTS.md` 定义的工作流程
