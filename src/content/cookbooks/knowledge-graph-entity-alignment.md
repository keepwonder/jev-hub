---
title: "Knowledge Graph Entity Alignment · 实体对齐"
description: "知识图谱里的实体对齐:不同数据源描述的是不是同一个实体?用 Jev Choice 在 N 个候选里挑出最匹配的。"
source: "https://docs.typesafe.ai/cookbooks/entity_alignment"
sourceUpdated: 2026-09-20
difficulty: "advanced"
tags: ["knowledge-graph", "entity-linking", "graph"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/entity_alignment
> 抓取时间:2026-09-20

## 场景

两个知识图谱:
- A:企业内部图(老数据库导出的)
- B:外部 Wikidata / Google KG

需要找出"A 里的 entity X = B 里的 entity Y"。

## 方案

```python
candidates = fetch_candidates_from_B(X_id)  # top 5 by embedding similarity
resp = client.system_one(
    state={"entity_a": X, "candidates_b": candidates},
    questions={
        "match": Choice(["none"] + [c.id for c in candidates],
                        instructions="Which candidate in B is the same entity as A?")
    }
)
```

## 何时用

- 多源数据合并
- 实体链接(knowledge graph completion)
- 跨数据库的主数据管理
