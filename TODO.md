# TODO

> 个人项目轻量待办清单（与代码同版本）
> 
> **自动推进机制：** 心跳每 30 分钟检查，Agent 空闲 + 有 TODO → 自动推进
> **流程：** 见 AGENTS.md "TODO 自动推进"章节

## 约定
- 优先级：P0（紧急）/ P1（高）/ P2（中）/ P3（低）
- 格式：
  ```
  - [ ] [P?] 标题
    - 目标：
    - 验收：
    - 备注：
  ```

---

## 📋 待办事项

- [x] [P1] 升级 Astro 到 6.0 + 迁移内容集合到 Content Layer API
  - 目标：升级 Astro 5.18.1 → 6.0.8，迁移 src/content/config.ts → src/content.config.ts
  - 验收：npm run build 成功，文章列表和详情页正常显示
  - 备注：Astro 6.0 移除了旧版内容集合 API，必须迁移