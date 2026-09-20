---
title: "Semantic Find · GitHub ToS 语义搜索"
description: "在 GitHub Terms of Service 上按自然语言查询搜索,一行代码对 218 个候选段落打分,选出真正相关的。"
source: "https://docs.typesafe.ai/cookbooks/semantic_find"
sourceUpdated: 2026-09-20
difficulty: "intermediate"
tags: ["search", "semantic", "rerank"]
primaryQuestion: "Score"
---

> 来源:docs.typesafe.ai/cookbooks/semantic_find
> 抓取时间:2026-09-20

## 模式

```python
resp = client.system_one(
    state={"query": user_query, "lines": list_of_218_lines},
    questions={
        f"score_{i}": Score(["irrelevant","tangentially related","highly relevant"],
                            instructions=f"How relevant is line {i} to the query?")
        for i in range(218)
    }
)

# 找 top-k
top = sorted(range(218), key=lambda i: resp[f"score_{i}"].score, reverse=True)[:5]
```

## 关键洞察

一次调用给 218 个段落打分——但只有输入 token 收费,输出还是免费,所以成本接近 **0**。

## 何时用

任何"大文档里找相关章节"的需求:法律合同、技术文档、API 文档、政策条款。
