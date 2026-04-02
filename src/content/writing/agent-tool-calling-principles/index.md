---
title: "Claude Code//Agent 底层揭秘：模型从不执行代码，它只是在玩文字游戏"
description: "深入解析 LLM 工具调用的底层原理，揭开 function calling 的神秘面纱"
pubDate: "2026-04-02"
tags: ["ai", "agent", "llm"]
draft: false
cover: "./cover.jpg"

by:
  role: coauthored
  name: 唐靖凯
  note: "主人提供 Obsidian 草稿，获麟负责发布流程"
source:
  kind: original
---
> 在《Claude Code 泄露 51 万行源码，我用 Java 手搓了同款 Agent》里，我们手搓了一个最基础的 AI Agent，跑通了 ReAct 循环。但有一个问题被刻意跳过了——**模型到底是怎么"调用工具"的？**
>
> 它真的理解了工具吗？还是只是在玩一个精心设计的文字游戏？

---

## 一、前情提要

上篇文章，我们用 Java 从零搭了一个 Agent，核心是一个 while 循环：

```
调用 LLM → 有 tool_calls 就执行工具 → 没有就结束
```

代码跑起来后，你输入 "查一下上海天气"，Agent 就真的去调了 `get_weather` 工具，拿到结果，再整合回复你。看上去很"智能"。

但如果你停下来想一秒：**LLM 是一个文本生成模型，它只会输出文字。它怎么"调用"了一个 Java 函数？**

答案是：**它没有。** 它只是输出了一段特殊格式的 JSON，我们的代码看到这段 JSON 后去执行了对应的函数。

这篇文章就来扒开这层窗户纸，用真实的 HTTP 请求/响应日志，一帧一帧地看清楚整个过程。

---

## 二、一个真实的例子

我们用上篇搭好的 `agent-from-scratch` 项目的`demo00`模块，给 Agent 出了一道条件题：

> **"明天上海天气怎么样？如果有雨，则计算一年有多少个小时"**

这个任务包含了：
1. 工具调用（查天气）
2. 条件判断（有没有雨）
3. 再次工具调用（计算器）
4. 最终整合回复

让我们打开 DEBUG 日志，看看 Agent 和 LLM 之间到底发生了什么。

---

## 三、第一轮：LLM 说"我要查天气"

### 请求：我们发给 LLM 的

Agent 启动后，向 LLM 发出第一次请求。请求体是一个标准的 Chat Completion API 调用，核心有两个部分——**消息列表**和**工具定义**：

```json
{
  "model": "qwen3.5-plus",
  "messages": [
    {
      "role": "system",
      "content": "你是一个有帮助的 AI 助手。你可以使用提供的工具来帮助用户完成任务。\n\n执行规则:\n1. 分析用户的请求，判断需要使用哪些工具\n2. 如果需要多个工具，按逻辑顺序依次调用\n3. 根据工具返回的结果，整合信息回复用户\n4. 如果不需要工具就能回答，直接回答即可"
    },
    {
      "role": "user",
      "content": "明天上海天气怎么样？如果有雨，则计算一年有多少个小时"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "calculator",
        "description": "计算数学表达式，支持加减乘除和括号。输入一个数学表达式字符串，返回计算结果。",
        "parameters": {
          "type": "object",
          "properties": {
            "expression": {
              "description": "数学表达式，例如 '(3 + 5) * 2'",
              "type": "string"
            }
          },
          "required": ["expression"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "get_current_time",
        "description": "获取当前的日期和时间。无需参数。",
        "parameters": { "type": "object", "properties": {} }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "查询指定城市的当前天气情况。",
        "parameters": {
          "type": "object",
          "properties": {
            "city": {
              "description": "城市名称，例如 '上海'、'北京'",
              "type": "string"
            }
          },
          "required": ["city"]
        }
      }
    }
  ]
}
```

注意看 `tools` 字段——**我们把"菜单"递给了 LLM。** 每个工具就像餐厅菜单上的一道菜：名字是什么、干什么用的、需要哪些"配料"（参数）。LLM 不需要知道厨房（我们的 Java 代码）怎么做菜，它只需要看菜单点单。

### 响应：LLM 回给我们的

```json
{
  "model": "qwen3.5-plus",
  "choices": [{
    "finish_reason": "tool_calls",
    "message": {
      "role": "assistant",
      "content": "",
      "tool_calls": [{
        "id": "call_9af19d6503564492a3d6abc3",
        "type": "function",
        "function": {
          "name": "get_weather",
          "arguments": "{\"city\": \"上海\"}"
        }
      }],
      "reasoning_content": "用户问明天上海天气怎么样，如果有雨，则计算一年有多少个小时。\n\n我需要：\n1. 先查询上海的天气情况\n2. 根据天气结果判断是否有雨\n3. 如果有雨，计算一年有多少个小时\n\n让我先调用 get_weather 工具查询上海天气。"
    }
  }]
}
```

**这就是"工具调用"的真相。** 来拆解一下：

| 字段 | 含义 |
|---|---|
| `finish_reason: "tool_calls"` | LLM 说"我还没说完，我需要先用一个工具" |
| `content: ""` | 没有给用户的文本回复——因为还没到回复的时候 |
| `tool_calls[0].function.name` | 想调用哪个工具：`get_weather` |
| `tool_calls[0].function.arguments` | 传什么参数：`{"city": "上海"}` |
| `tool_calls[0].id` | 这次调用的唯一 ID（后面回传结果要用） |
| `reasoning_content` | 模型的思考过程（有些模型支持） |

**LLM 没有调用任何函数。** 它只是生成了一段结构化的文本，说："我觉得下一步应该调用 `get_weather`，参数是 `{"city": "上海"}`"。至于这个函数怎么执行、结果是什么——**那是我们的代码的事。**

### 我们的代码做了什么

收到这个响应后，`AgentLoop` 做了三件事：

```
1. 看到 tool_calls 不为空 → 进入工具执行分支
2. 从 ToolRegistry 找到 "get_weather" 对应的 Java 实现
3. 调用 WeatherTool.execute({"city": "上海"}) → 拿到结果
```

```
🔧 调用工具: get_weather({"city": "上海"})
📋 工具结果: 上海天气: 多云转小雨，气温 18°C，湿度 75%，东南风 2 级
```

---

## 四、第二轮：LLM 说"有雨，我要算数"

### 请求：带上工具结果再问一次

现在关键来了——我们要把工具的执行结果"喂"回给 LLM。看看消息列表变成了什么：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个有帮助的 AI 助手..." },
    { "role": "user", "content": "明天上海天气怎么样？如果有雨，则计算一年有多少个小时" },
    {
      "role": "assistant",
      "content": "",
      "tool_calls": [{
        "id": "call_9af19d6503564492a3d6abc3",
        "type": "function",
        "function": { "name": "get_weather", "arguments": "{\"city\": \"上海\"}" }
      }]
    },
    {
      "role": "tool",
      "content": "上海天气: 多云转小雨，气温 18°C，湿度 75%，东南风 2 级",
      "tool_call_id": "call_9af19d6503564492a3d6abc3"
    }
  ]
}
```

消息列表从 2 条变成了 4 条。新增的两条是：

1. **`assistant` 消息（带 tool_calls）** — LLM 上一轮的"点单"记录
2. **`tool` 消息** — 我们执行工具后的结果，通过 `tool_call_id` 关联到对应的调用

**这就是 Agent 的"短期记忆"——所有历史对话、工具调用、工具结果，全部以消息列表的形式传给 LLM。** LLM 每次都能看到完整的上下文，所以它知道自己之前做了什么、结果是什么。

### 响应：LLM 做了条件判断

```json
{
  "choices": [{
    "finish_reason": "tool_calls",
    "message": {
      "role": "assistant",
      "tool_calls": [{
        "id": "call_f610b53ee7dd4d1dbc76ec84",
        "type": "function",
        "function": { "name": "calculator", "arguments": "{\"expression\": \"365 * 24\"}" }
      }],
      "reasoning_content": "上海明天的天气是多云转小雨，所以有雨。需要计算一年有多少个小时。\n一年通常按365天计算（非闰年），一天24小时。\n计算：365 * 24"
    }
  }]
}
```

注意 `reasoning_content`：模型读到了天气结果里的"小雨"，判断"有雨"，于是决定调用计算器。**条件判断完全在 LLM 的推理过程中完成**——我们的代码没有写任何 if/else，LLM 自己理解了任务逻辑。

```
🔧 调用工具: calculator({"expression": "365 * 24"})
📋 工具结果: 8760
```

---

## 五、第三轮：LLM 说"我想好了，给你答案"

### 请求：消息列表已经有 6 条了

```json
{
  "messages": [
    { "role": "system",    "content": "你是一个有帮助的 AI 助手..." },
    { "role": "user",      "content": "明天上海天气怎么样？如果有雨，则计算一年有多少个小时" },
    { "role": "assistant", "tool_calls": [{ "function": { "name": "get_weather", ... } }] },
    { "role": "tool",      "content": "上海天气: 多云转小雨，气温 18°C...", "tool_call_id": "call_9af..." },
    { "role": "assistant", "tool_calls": [{ "function": { "name": "calculator", ... } }] },
    { "role": "tool",      "content": "8760", "tool_call_id": "call_f610..." }
  ]
}
```

六条消息形成了完整的推理链：用户提问 → 查天气 → 天气结果 → 算数 → 算数结果。LLM 拿着这条完整的"对话记录"，可以做最终整合了。

### 响应：终于给人话了

```json
{
  "choices": [{
    "finish_reason": "stop",
    "message": {
      "role": "assistant",
      "content": "明天上海的天气是多云转小雨，气温18°C，湿度75%，东南风2级。\n\n由于明天有雨，我计算了一年有多少个小时：一年有365天，每天24小时，所以一年共有8760个小时。"
    }
  }]
}
```

`finish_reason` 从之前的 `"tool_calls"` 变成了 `"stop"` —— LLM 觉得任务完成了，给出了最终的文本回复。**没有 tool_calls，Agent Loop 退出循环，把这段话返回给用户。**

---

## 六、全景图：三轮调用的完整流程

把三轮对话画成时序图：

```
         我们的代码                    LLM API
            │                           │
  Step 1    │──── messages(2条) ────────►│
            │    + tools(3个工具)        │
            │                           │  思考："先查天气"
            │◄── tool_calls: ──────────│
            │    get_weather("上海")     │
            │                           │
   执行工具  │ WeatherTool.execute()     │
            │ → "多云转小雨, 18°C"      │
            │                           │
  Step 2    │──── messages(4条) ────────►│
            │    [含天气结果]            │
            │                           │  思考："有雨，要算数"
            │◄── tool_calls: ──────────│
            │    calculator("365*24")    │
            │                           │
   执行工具  │ CalculatorTool.execute()  │
            │ → "8760"                  │
            │                           │
  Step 3    │──── messages(6条) ────────►│
            │    [含天气+计算结果]       │
            │                           │  思考："信息齐了"
            │◄── content: ─────────────│
            │    "明天上海多云转小雨..." │
            │                           │
   任务完成  │ → 返回给用户             │
```

**三轮 HTTP 请求，三次 LLM 调用，两次工具执行，一个最终答案。**

---

## 七、所以，"工具调用"到底是什么？

现在可以回答开头的问题了。

### 它不是什么

- ❌ LLM 不会执行代码
- ❌ LLM 不会发 HTTP 请求
- ❌ LLM 不会访问数据库
- ❌ LLM 没有连接任何外部系统

### 它是什么

**工具调用 = LLM 的结构化输出 + 我们的代码执行 + 结果回传。**

整个过程可以精确地分解为三个角色：

| 角色 | 职责 | 类比 |
|---|---|---|
| **LLM** | 看菜单，决定点什么菜，写下订单 | 顾客 |
| **Agent Loop** | 接订单，把订单送到厨房，把菜端回来 | 服务员 |
| **Tool** | 按订单做菜，返回成品 | 厨师 |

LLM 的"能力"在于：它能理解自然语言任务，判断需要哪个工具、传什么参数。这全靠训练——模型在训练阶段见过大量的 function calling 示例，学会了在合适的时机输出特定格式的 JSON。

**说到底，function calling 是一种约定好的输出格式。** 就像 Markdown 是一种文本格式一样，function calling 是 LLM 和外部世界之间的一种协议。

---

## 八、Token 消耗：一个可能被忽视的细节

从日志里可以提取每轮的 Token 用量：

| 轮次 | Prompt Tokens | Completion Tokens | 其中推理 Tokens | 总计 |
|---|---|---|---|---|
| Step 1 | 503 | 91 | 61 | 594 |
| Step 2 | 571 | 83 | 47 | 654 |
| Step 3 | 624 | 167 | 107 | 791 |
| **合计** | **1698** | **341** | **215** | **2039** |

几个值得注意的点：

1. **Prompt Tokens 逐轮增长**（503 → 571 → 624）——因为消息列表在不断追加，每轮都要把之前的完整对话历史重新发给 LLM。这就是为什么长对话会越来越贵。

2. **工具定义本身也占 Token**——三个工具的 schema 每轮都要发送，大约占 200+ tokens。Claude Code 有 40+ 个工具，光是工具定义就是一笔不小的开销。

3. **推理 Token 单独计费**——`reasoning_tokens` 是模型的"思考过程"，这部分 token 用户看不到但要付钱。Step 3 的推理 token 最多（107），因为要综合所有信息生成最终回复。

---

## 九、回到本质

如果再往下挖一层，function calling 的本质其实更简单。

在没有 function calling API 之前，人们怎么让 LLM "调用工具"？**靠 prompt 约定格式。** 比如：

```
当你需要使用工具时，请用以下格式输出：
{"tool": "工具名", "args": {"参数名": "参数值"}}
```

然后在代码里用正则表达式去解析 LLM 的输出，提取 JSON，执行工具。

**Function Calling API 做的事情本质上一样**——只不过把这个"格式约定"内化到了模型训练中，让 LLM 输出更加稳定和可靠的结构化数据。不再需要我们写脆弱的正则去解析，API 直接在响应的 `tool_calls` 字段里给出结构化的结果。

这就是为什么我们在《Claude Code 泄露 51 万行源码，我用 Java 手搓了同款 Agent》里的 `AgentLoop` 代码如此简单——所有的"智能"都在 LLM 端完成了，我们只需要做一个忠实的"服务员"：接收订单、执行、回传。

---

## 总结

一句话：**模型不会调用工具，模型只会"说"它想调用什么工具。真正执行的，是我们的代码。**

整个 function calling 的魔法，不过是一个精心设计的接力赛：

1. 我们告诉 LLM："这是你的工具菜单"（tools schema）
2. LLM 理解任务后说："我要用这个工具"（tool_calls）
3. 我们执行工具，把结果告诉 LLM："这是结果"（tool message）
4. LLM 综合所有信息，给出最终答案（content）

理解了这一层，Agent 就不再神秘。它不是黑魔法，它是一个**设计精巧的对话协议**。

---

*本文源码：[agent-from-scratch](https://github.com/JingkaiTang/agent-from-scratch)*