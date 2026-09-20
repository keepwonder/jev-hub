---
title: "Hierarchical Classification · 深度分类树"
description: "通过并行 beam search 在 TypeSafe Choice 概率上做层级分类——专利、零售、生物医学、源代码 4 个层级。"
source: "https://docs.typesafe.ai/cookbooks/hierarchical_classification"
sourceUpdated: 2026-09-20
difficulty: "advanced"
tags: ["classification", "hierarchical", "beam-search"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/hierarchical_classification
> 抓取时间:2026-09-20

## 模式

层级分类(分类学)是 Jev 的杀手场景:
- 顶层:粗分类(生物 / 物理 / 化学)
- 第二层:细分类
- 叶子:具体实体

每层用一道 Choice 题,用前一层的概率做 beam search 剪枝。

```python
def classify(text: str) -> list[float]:
    resp = client.system_one(state=text, questions={
        "level1": Choice(top_labels, instructions="Top-level category?"),
        "level2": Choice(level2_labels, instructions="Sub-category?"),
    })
    # Combine probabilities with weights
    return combine_probabilities([resp.level1.probabilities, resp.level2.probabilities])
```

## 何时用

任何有明确层级 schema 的分类:产品 SKU 树、文档分类、邮件路由、ICD-10 编码、生物分类。
