---
title: "Line-by-line Search · 文档级语义 grep"
description: "对文档每行(或每段)用 Choice/Score 打分。218 行 1 次调用搞定。找相关行用 Noul 再确认文档是否包含答案。"
source: "https://docs.typesafe.ai/cookbooks/semantic_find"
sourceUpdated: 2026-09-20
difficulty: "intermediate"
tags: ["search", "semantic", "rerank", "documentation"]
primaryQuestion: "Noul"
---

> 来源:docs.typesafe.ai/cookbooks/semantic_find
> 抓取时间:2026-09-20

## 模式

```python
resp = client.system_one(
    state={"query": "What is the refund policy?", "lines": list_of_218_lines},
    questions={
        f"rel_{i}": Score(["irrelevant","tangential","relevant"],
                          instructions=f"How relevant is line {i}?")
        for i in range(218)
    } | {
        "contains_answer": Noul("Does this document contain the answer?")
    }
)
```

两道题共用一个 state:
- Score 题:对每行打分(精确但贵)
- Noul 题:对整篇判断是否有答案(便宜,先做 gate)

## 何时用

技术文档 / 法律合同 / 长篇 FAQ 的语义搜索。比 embedding 检索更精确,比 LLM 重排序便宜 100 倍。
