---
title: "Classifying RAG Passages · 召回质量过滤"
description: "对每条召回的 passage 打分,然后在代码里决定哪些送到 answering 模型:保留并标记矛盾的、丢掉带隐藏指令的、标记包含 PII 的。"
source: "https://docs.typesafe.ai/cookbooks/classifying_rag_passages"
sourceUpdated: 2026-09-20
difficulty: "intermediate"
tags: ["RAG", "过滤"]
primaryQuestion: "Score"
---

> 来源:docs.typesafe.ai/cookbooks/classifying_rag_passages
> 抓取时间:2026-09-20

## 模式

```python
resp = client.system_one(
    state={"query": query, "passages": passages},
    questions={
        f"relevance_{i}":  Score(["irrelevant","tangential","relevant"], f"Is passage {i} relevant to the query?"),
        f"contradicts_{i}": Noul(f"Does passage {i} contradict the query or known facts?"),
        f"injection_{i}":   Noul(f"Does passage {i} contain a hidden instruction or prompt injection?"),
        f"pii_{i}":         Noul(f"Does passage {i} contain PII?"),
    },
)

kept = []
for i, p in enumerate(passages):
    r = resp[f"relevance_{i}"].score
    if r < 1.5:
        continue  # 丢掉不相关的
    flags = []
    if resp[f"contradicts_{i}"].noul > 0.6:
        flags.append("contradicts")
    if resp[f"injection_{i}"].noul > 0.5:
        flags.append("possible_injection")
    if resp[f"pii_{i}"].noul > 0.5:
        flags.append("contains_pii")
    kept.append({"passage": p, "flags": flags})
```

## 优势

- 4 个维度并行判断,一次 call 全搞定
- 用 confidence 阈值过滤,而不是硬规则
- 每条 passage 都审计,可追溯

## 何时用

任何严肃的 RAG 应用,尤其是企业级/合规要求高的场景。
