---
title: "Parallel Questions · 13 题一次调用"
description: "用一个 TypeSafe 调用跑 13 个问题,展示批量调用比 13 次单独调用便宜 12.2 倍、快 10 倍。"
source: "https://docs.typesafe.ai/cookbooks/parallel_questions"
sourceUpdated: 2026-09-20
difficulty: "beginner"
tags: ["performance", "batch"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/parallel_questions
> 抓取时间:2026-09-20

跑 13 个监管简报问题覆盖 GDPR Wikipedia 文章,展示批量调用比单独调用**便宜 12.2 倍、快 10 倍**,且答案质量不变。

## 这个 Cookbook 证明的事

- **批处理不是锦上添花,是核心成本模型**
- 多个 question 并行执行,加问题几乎不增加延迟
- 输出 token 实际上"免费"(因为根本没生成 token)
- 输入 token 一样,但 HTTP 开销大幅减少

## 代码骨架

```python
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

client = TypeSafeClient()

questions = {
    "applies_to_eu":     Noul("Does GDPR apply to entities in the EU?"),
    "max_fine_amount":   Noul("Can fines under GDPR reach 4% of global turnover?"),
    "right_to_erasure":  Noul("Does GDPR grant individuals the right to erasure?"),
    "data_portability":  Noul("Does GDPR provide a right to data portability?"),
    # ... 共 13 道题
}

resp = client.system_one(state=gdpr_text, questions=questions)
```

## 性能数据

| 调用方式 | 延迟 | 成本 |
|---|---|---|
| 13 次单独调用 | ~6.5s | ~$0.026 |
| **1 次批量调用** | **~650ms** | **~$0.0021** |

**节省 12.2 倍成本 + 10 倍延迟**。

## 何时用

任何时候你有"对同一份 state 的多个独立判断",都应该合并成一个 call,而不是多次 call。
