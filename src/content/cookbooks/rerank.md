---
title: "Re-ranking · BM25 候选集的精确重排"
description: "为 40 个 CLERC 法律查询的 30 段 BM25 短名单,用一道 Jev 题把 top-1 准确率从 5% 提到 18%,top-10 从 38% 提到 62%。"
source: "https://docs.typesafe.ai/cookbooks/rerank_typesafe"
sourceUpdated: 2026-09-20
difficulty: "intermediate"
tags: ["RAG", "rerank", "搜索"]
primaryQuestion: "Score"
---

> 来源:docs.typesafe.ai/cookbooks/rerank_typesafe
> 抓取时间:2026-09-20

## 问题

embedding 检索在法律领域常常不够精确——top-1 准确率只有 5%。

## 方案

BM25 检索出 30 个候选文档,对每个候选问一道 Score 题。

## 结果

| 指标 | BM25 only | BM25 + Jev rerank |
|---|---|---|
| top-1 准确率 | 5% | **18%** |
| top-10 准确率 | 38% | **62%** |

## 代码骨架

```python
def jev_rerank(query, candidates):
    resp = client.system_one(
        state={"query": query, "candidates": candidates},
        questions={
            f"rel_{i}": Score(
                ["irrelevant", "tangentially relevant", "directly relevant"],
                instructions=f"How relevant is candidate {i}?"
            )
            for i in range(len(candidates))
        }
    )
    return sorted(
        range(len(candidates)),
        key=lambda i: resp[f"rel_{i}"].score,
        reverse=True
    )
```

## 关键洞察

Jev 比传统 cross-encoder reranker 更便宜(因为不输出 token)、更快(并行采样)、而且支持自定义 score 刻度。

## 何时用

任何 RAG 流水线里,如果"检索的 top-k 噪声太多",都该用这个模式。
