---
title: "Citation Check · 抓出幻觉引用"
description: "用一道 Choice 题判断'引用的上下文是否支持这个声明',把幻觉引用抓出来送人工复核。"
source: "https://docs.typesafe.ai/cookbooks/citation_check"
sourceUpdated: 2026-09-20
difficulty: "beginner"
tags: ["RAG", "verification"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/citation_check
> 抓取时间:2026-09-20

## 模式

RAG 输出常常引用错位——声称"根据 X 文档说 Y",但 X 文档其实没这么说。Jev 可以抓这种错。

```python
resp = client.system_one(
    state={"claim": claim, "source_doc": source_doc},
    questions={
        "supports": Choice(
            ["supports", "contradicts", "irrelevant"],
            instructions="Does the source doc's context support the claim?"
        ),
    },
)

if resp.supports.choice == "supports":
    pass
elif resp.supports.choice == "contradicts":
    flag_for_review(reason="citation contradicts source")
else:
    flag_for_review(reason="citation irrelevant to source")
```

## 关键洞察

Jev 的 confidence 在这里特别有用——如果模型在判断"是否支持"时 confidence < 0.7,直接送人工。

## 何时用

任何 RAG / 检索增强生成应用,需要审计引用真实性时。
