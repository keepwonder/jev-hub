---
title: "State · 输入材料"
description: "如何构造 state 来给 Jev 提供充分上下文。"
source: "https://docs.typesafe.ai/concepts/state"
sourceUpdated: 2026-09-20
category: "concepts"
order: 2
---

> 镜像自 [docs.typesafe.ai/concepts/state](https://docs.typesafe.ai/concepts/state)
> 抓取时间:2026-09-20

## 什么是 State

**State** 是你让 System One 模型评估的内容。可以是一封客服消息、一段文章,或你的应用当前状态。

每次请求评估一个 state 配一组 questions。所有 questions 看到同一个 state,独立评估。

## State 可以是字符串或结构化 JSON

最简单的是字符串:

```python
state = "My card was charged twice."
```

也可以是 JSON object,包含相关字段、记录、上下文:

```python
state = {
    "message": "My card was charged twice.",
    "order_id": "A-104",
    "user_tier": "premium",
}
```

或者数组(消息序列):

```python
state = [
    {"from": "customer", "text": "Hi, I need help."},
    {"from": "customer", "text": "My card was charged twice."},
]
```

## 格式选择指南

| 格式 | 适合 |
|---|---|
| String | 单段文本(消息、文章、段落) |
| Object | 含命名字段的多块信息(推荐) |
| Array | 多条消息 / 记录序列 |

**推荐**:多数情况用 Object,每个字段有清晰语义名。

## 注意事项

- 只支持文本(字符串、JSON 内的字符串、数字、布尔、null)
- 图片、音频、视频不支持
- 中文可识别,但英文准确率更高
- 上下文窗口有限(详见 Cheatsheet)

## 内容 vs 问题分离

**State** 装内容和支撑事实。**Questions** 定义判断。

举例:把退款请求和政策放在 state,然后问"客户要求退款了吗?"和"政策支持吗?"。

```python
state = {
    "ticket": {...},
    "refund_policy": "Duplicate charges are eligible for a refund.",
}

questions = {
    "wants_refund": Noul("Does the customer request a refund?"),
    "policy_supports": Noul("Does the policy support issuing a refund here?"),
}
```
