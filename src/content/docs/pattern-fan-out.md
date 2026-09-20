---
title: "Pattern · Speculative Fan-Out"
description: "一次发一堆 question,包括试探性的,让代码挑有用的。"
source: "https://docs.typesafe.ai/patterns/fan-out"
sourceUpdated: 2026-09-20
category: "patterns"
order: 1
---

> 镜像自 [docs.typesafe.ai/patterns/fan-out](https://docs.typesafe.ai/patterns/fan-out)
> 抓取时间:2026-09-20

## 核心思想

与其**先**收集信息再决定问什么,**不如**一次发一堆 question(含试探性的),让 Jev 并行评估,在代码里挑有用的。

## 为什么

- Jev 加 question **几乎不增加延迟**
- 输出 token **免费**
- 一次 call 比 N 次 call **便宜 12 倍以上**

## 典型场景

**RAG 流水线**——你不知道召回的哪几条有用:

```python
questions = {
    f"is_relevant_{i}": Noul(f"Is passage {i} relevant to the query?")
    for i in range(len(passages))
}
# 然后在代码里只取 confidence > 0.7 的
```

**客服分诊**——不知道哪种判断最重要:

```python
questions = {
    "team":     Choice(["billing","technical","account","shipping","other"]),
    "urgency":  Score(["low","medium","high","critical"]),
    "wants_refund": Noul("..."),
    "is_complaint": Noul("..."),
    "is_escalation": Noul("..."),  # 试探性,可能不用
}
```

## 成本

13 question 的 fan-out 比 13 次单独 call **便宜 12.2 倍、快 10 倍**(官方 benchmark)。

## 与 confidence-gated routing 配合

试探性 question 的 confidence < 0.5 时直接丢弃,只保留高 confidence 的判断作为下游决策依据。
