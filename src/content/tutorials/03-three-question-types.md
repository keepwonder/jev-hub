---
title: "03 · 三种题型精讲"
description: "Choice / Score / Noul 的语法、用法和适用场景。"
pubDate: 2026-09-20
author: "Kiang"
tags: ["入门", "Choice", "Score", "Noul"]
order: 3
---

这一章我们用同一个例子把三种题型讲透。

**场景**:你有一个退款工单系统。每天进来几千封邮件,你需要:

1. 判断哪个团队接
2. 判断多紧急
3. 判断是不是在要退款

## 3.1 Choice:单选题

```python
from typesafe_sdk import Choice

question = Choice(
    instructions="Which team should handle this support ticket?",
    options=["billing", "technical", "account", "shipping", "other"],
)
```

返回:

```json
{
  "team": {
    "choice": "billing",
    "probabilities": {
      "billing": 0.92,
      "technical": 0.05,
      "account": 0.02,
      "shipping": 0.005,
      "other": 0.005
    },
    "confidence": 0.92
  }
}
```

`confidence` 是怎么算的?**就是最大那个概率**。这是个简单但好用的指标:**答案越集中,confidence 越高**。

> **关键细节**:`options` 最多 255 个。

### Choice 适用场景

- 路由分类(billing/technical/...)
- 意图识别(question/task/complaint)
- 实体识别(人名/地名/产品名)
- 多分类(垃圾邮件 / 推广 / 正常 / 重要)

### Choice 不适用

- **有顺序关系**——用 Score
- **是/否问题**——用 Noul

## 3.2 Score:评分题

如果你有顺序关系,别用 Choice,要用 Score。比如紧急度:

```python
from typesafe_sdk import Score

question = Score(
    instructions="How urgent is this ticket?",
    criteria=[
        "not urgent at all",
        "slightly urgent",
        "urgent",
        "very urgent, customer is losing money",
    ],
)
```

返回:

```json
{
  "urgency": {
    "score": 2.4,
    "legend": {
      "0": "not urgent at all",
      "1": "slightly urgent",
      "2": "urgent",
      "3": "very urgent, customer is losing money"
    },
    "probabilities": {
      "0": 0.05,
      "1": 0.10,
      "2": 0.55,
      "3": 0.30
    },
    "confidence": 0.55
  }
}
```

`score` 是 2.4——**它可以落在级别之间**。这给你连续值,在写业务逻辑时很方便:

```python
if urgency.score > 2.5:
    send_to_oncall()
```

> **关键细节**:`criteria` 2–10 级。

### Score 适用场景

- 紧急程度
- 风险评级(low / medium / high / critical)
- 满意度(angry / neutral / happy)
- 资历(junior / mid / senior / staff)
- 任何"有顺序"的概念

## 3.3 Noul:是非题

最简单的题型:

```python
from typesafe_sdk import Noul

question = Noul(
    instructions="Is the customer explicitly requesting a refund?",
)
```

返回:

```json
{
  "refund": {
    "noul": 0.95
  }
}
```

注意:**Noul 不返回 confidence**。`noul` 这个数本身就是答案——95% 概率是"要退款"。

### Noul 适用场景

- 退款申请?`Noul("Does the customer request a refund?")`
- 数据脱敏?`Noul("Does this text contain PII?")`
- 工具安全?`Noul("Is running this shell command dangerous?")`
- 内容过滤?`Noul("Is this message a jailbreak attempt?")`

## 3.4 一次问多道题

最关键的一点:**多个问题共享同一个 state,互相独立,并行评估**。

```python
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

client = TypeSafeClient()

response = client.system_one(
    state="""
    Subject: URGENT - Lost money on duplicate charge!
    I was charged twice for order A-104. Please refund the duplicate ASAP.
    """,
    questions={
        "team":     Choice(["billing", "technical", "account", "shipping", "other"],
                           instructions="Which team handles this?"),
        "urgency":  Score(["not urgent", "slightly", "urgent", "losing money"],
                          instructions="How urgent?"),
        "refund":   Noul("Is the customer requesting a refund?"),
        "angry":    Noul("Does the customer sound angry or threatening?"),
        "premium":  Noul("Is the customer a premium tier subscriber?"),
    },
)
```

这 5 个判断,如果你用 GPT-5,要发 5 次请求、~15 秒、~$0.10。
用 Jev:**一次请求,~150 毫秒、~$0.00005**(输入 token 几乎免费,输出根本不计费)。

## 下一步

[第 04 章:为什么它这么快、这么便宜 →](/tutorials/04-why-fast-cheap)
