---
title: "Anthropic说Mythos太强了不敢发布，我觉得是太贵了"
description: "Anthropic 将 Mythos 包装成“强到不敢发布”的安全故事，但真正更像决定因素的，也许是高得离谱的推理成本。"
pubDate: "2026-04-08"
tags: [AI, Anthropic, Claude, Mythos, 商业分析]

draft: false
cover: "./cover.jpg"

by:
  role: owner
  name: 唐靖凯
source:
  kind: original
---

![](./cover.jpg)

前两天 Anthropic 发布了 Claude Mythos Preview——一个比 Opus 更大、更强、更贵的全新最高层级模型。

然后告诉你：**对不起，这个模型你不能用。**

不开放 API，不上线 claude.ai，而是搞了一个叫 "Project Glasswing"（玻璃翼计划）的网络安全项目，只向 AWS、Apple、Google、Microsoft 等 12 家核心合作方定向开放。

理由是：**模型太强了，网络安全能力太恐怖，在新的安全护栏开发完成前不敢公开。**

中文互联网各大媒体一片震撼——"强到不敢发布"、"聪明到不敢开放"、"太危险了"。

我看完之后只有一个想法：**是太强了，还是太贵了？**

---

## Mythos 确实很强

先把该夸的夸了。

Mythos 的 benchmark 确实炸裂，编码能力提升尤其惊人：

| 评测项 | Opus 4.6 | Mythos Preview | 提升 |
|---|---|---|---|
| SWE-bench Verified | 80.8% | 93.9% | +16% |
| SWE-bench Pro | 53.4% | 77.8% | **+46%** |
| SWE-bench Multimodal | 27.1% | 59.0% | **+118%** |
| GPQA Diamond | 91.3% | 94.6% | +4% |
| HLE（有工具） | 53.1% | 64.7% | +22% |

网络安全能力更是离谱。Firefox exploit 开发成功率从 Opus 的 2 次飙到 181 次；发现了 OpenBSD 里藏了 27 年的零日漏洞；能自主串联多个漏洞实现 Linux 内核提权；逆向闭源二进制后找漏洞——成本低于 $2,000，完全自主，无需人工干预。

244 页的 System Card 里还记录了一些细思极恐的行为：模型逃逸沙箱后，主动把逃逸方法发布到公开网站；获取禁止信息后，故意调整答案让自己"看起来不要太准确"；甚至尝试修改 git 历史来掩盖操作痕迹。

这些我不怀疑。

但——**能力强 ≠ 不能发布。能力强 + 成本爆表 = 不能发布。**

---

## 一台精密的碎钞机

聊安全之前，先看看 Anthropic 的财务状况。

| 指标 | 数据 |
|---|---|
| 2026 年烧钱率 | **$190 亿/年** |
| 其中训练支出 | $120 亿 |
| 其中推理支出 | $70 亿 |
| 毛利率 | **~40%**（软件行业标准 77%） |
| 盈亏平衡预期 | 推迟到 **2028 年** |
| 已承诺云成本（至 2029） | $800 亿 |
| 总融资额 | $670 亿 |

Dario Amodei 在采访中亲口说过："增长率偏差一年，公司就会面临破产。"

The Register 在报道 G 轮融资时的标题更直接："投资者将 another $30B 扔进了 Anthropic 的碎钞机。"

**这不是一家"有余力搞慈善安全项目"的公司。这是一家每天都在和破产赛跑的公司。**

带着这个背景，我们再来看 Mythos 的定价。

---

## Mythos 的定价：Opus 的 5 倍

| 模型 | Input / Output (per M tokens) |
|---|---|
| Haiku 4.5 | $1 / $5 |
| Sonnet 4.6 | $3 / $15 |
| Opus 4.6 | $5 / $25 |
| **Mythos Preview** | **$25 / $125** |

Mythos 的价格是 Opus 4.6 的 **5 倍**，是 Haiku 的 **25 倍**。

现在做一道简单的算术题：如果把 Mythos 开放给 Claude Pro（$20/月）或 Max（$100/月）订阅用户，一个重度用户一天能烧掉多少推理成本？

不用猜，Anthropic 刚刚用行动给出了答案。

---

## OpenClaw 事件：一次成本失控的预演

就在 Mythos 发布前 3 天——4 月 4 日，Anthropic 正式切断了 Claude 订阅对 OpenClaw 等第三方 Agent 工具的覆盖。

原因很简单：**月费 $200 的 Claude Max 订阅，被重度用户用出了 $5,000 的算力价值。**

Paper Compute 的分析更扎心——Claude Code Max 计划 $100/月，实际 API 成本在 $100-200/月（普通用户），而重度用户轻松翻数倍。为了止血，Anthropic 已经悄悄收紧了限制：5 小时使用窗口、不可预测的重置时间、Opus 和 Sonnet 之间的代币上限二选一。

逻辑链条很清晰：

**Opus 级别的订阅 → 已经肉疼到要封杀第三方工具**

**5 倍于 Opus 的 Mythos → 开放给订阅用户？**

想都不敢想。

---

## 国防部那 $2 亿

顺便聊聊前阵子的五角大楼事件。

官方叙事很动人——Dario Amodei 坚守红线，拒绝允许 Claude 用于自主武器和公民监控，被五角大楼取消了 $2 亿合同。AI 伦理标杆，风骨可嘉。

但换个角度：五角大楼要的是**无限制军事使用**——海量、高强度、7×24 不间断的推理负载。对一家毛利率只有 40% 的公司来说，$2 亿能覆盖这种级别的使用量吗？

我不确定。但我注意到了一条时间线：

| 时间 | 事件 |
|---|---|
| 2 月 12 日 | G 轮融资 $300 亿 |
| 2 月 26 日 | 拒绝五角大楼最后通牒 |
| 3 月 1 日 | 合同正式取消 |
| 4 月 4 日 | 封杀 OpenClaw |
| 4 月 7 日 | Mythos 限制发布 |
| 10 月（目标） | IPO |

这三件事发生在不同时间、出于不同原因，但底层逻辑高度一致：**控制成本出血口。**

---

## $670 亿背后站着谁

说到 IPO，就不得不看看 Anthropic 背后站着什么人。

G 轮 $300 亿的投资者阵容：

- **领投**：GIC（新加坡主权基金）、Coatue
- **参投**：红杉、贝莱德、黑石、富达、摩根大通、摩根士丹利、高盛、淡马锡、卡塔尔主权基金
- **战略注资**：Microsoft $50 亿、NVIDIA $100 亿
- **最大单一投资者**：Amazon 累计 $80 亿

两个主权基金、三大投行、四家顶级 VC、两家云巨头、一个芯片霸主。**这些人投的不是情怀，是回报。**

IPO 只剩 6 个月——目标 2026 年 10 月，估值 $4,000-5,000 亿，高盛和摩根大通联席承销。在这个窗口期，每一个动作都要对 IPO 叙事负责。

Anthropic 确实设了一个 Long-Term Benefit Trust（长期利益信托），理论上能防止投资者篡改公司使命。但信托保护的是使命，不是现金流。

**LTBT 不会替你付 $190 亿的年度账单。**

投资者可以为有原则的 CEO 鼓掌，但掌声只持续到季度财报出来为止。

---

## Project Glasswing：一石二鸟的完美叙事

现在把所有线索串起来：

```
Mythos 推理成本 = Opus 的 5 倍
→ 不可能塞进 $20-200/月的订阅
→ 需要找到愿意按 $25/$125 per M tokens 付费的客户
→ 谁会付这个价？只有大企业和基础设施组织
→ 包装成"安全计划"，限定 12 家核心合作方
→ 先提供 $1 亿额度让人上瘾
→ 额度用完后按天价收费
→ 完美避开了"为什么不给普通用户用"的质问
```

Project Glasswing 最精妙的地方在于：**它同时解决了安全问题和商业问题——用同一个叙事。**

安全是真的。成本也是真的。

但决定不公开发布的那个会议室里，**CFO 可能比 CSO 更有发言权。**

---

## 不是说安全不重要

别误会。Mythos 的安全能力确实恐怖，负责任地限制发布也确实合理。244 页 System Card 里那些案例——沙箱逃逸、掩盖痕迹、未经授权发布——都是真实的风险。

但我有一个思想实验：**如果 Mythos 的推理成本跟 Sonnet 一个量级，Anthropic 还会选择不公开吗？**

我猜大概率会搞一个"带安全护栏的公开版"，而不是搞一个"12 家合作方的定向计划"。

**成本改变决策的权重分配。** 当模型便宜的时候，"安全可控地公开"是最优解；当模型贵到离谱的时候，"以安全之名定向高价出售"才是最优解。

两条路都能走通，只是成本帮 Anthropic 选了那条更赚钱的。

---

## 一些数字的巧合

最后贴一个我觉得很有意思的对照表：

| 事件 | 官方叙事 | 另一种读法 |
|---|---|---|
| Mythos 限制发布 | 安全考量 | 5x 成本扛不住 |
| 封杀 OpenClaw | 保护算力资源 | $200 订阅 → $5,000 成本 |
| 拒绝五角大楼 | AI 伦理红线 | $2 亿覆盖不了军方使用量 |
| Project Glasswing | 保护关键基础设施 | 定向变现大客户 |
| G 轮 $300 亿 | 市场信任 | IPO 前最后输血 |
| 超级碗广告 | 品牌建设 | 急需 C 端用户撑估值 |

两种解读都成立。真相大概在中间。

但当一家年烧 190 亿美元的公司告诉你"这个模型太强了不能给你用"，我觉得至少值得问一句：

**是太强了，还是太贵了？**

---

## 数据来源

1. **Anthropic 红队报告** - https://red.anthropic.com/2026/mythos-preview/
2. **赛博禅心：Mythos 全面解读** - https://mp.weixin.qq.com/s/gu0pFEQlb8NeKBFU-cdhpA
3. **Anthropic 财务分析（The AI Bridge）** - https://theaibridges.substack.com/p/how-anthropic-went-from-1-billion
4. **Claude Code 真实成本（Paper Compute）** - https://papercompute.com/blog/true-cost-of-claude-code/
5. **OpenClaw 封杀（QQ 新闻）** - https://news.qq.com/rain/a/20260404A05ZSX00
6. **五角大楼合同（AP）** - https://apnews.com/article/anthropic-pentagon-ai-dario-amodei-hegseth
7. **G 轮投资者名单（The AI Track）** - https://theaitrack.com/anthropic-series-g-funding-30-billion/
8. **IPO 计划（TECHi）** - https://www.techi.com/anthropic-ipo/
9. **CNBC: Mythos 报道** - https://www.cnbc.com/2026/04/07/anthropic-claude-mythos-ai-hackers-cyberattacks.html
