---
title: "Entity Alignment · 两份产品目录对齐"
description: "判断两个啤酒目录里哪些产品是同一个:从 450 对候选里决定每对是否合并、保留、还是人工审核。一道 Score 题搞定。"
source: "https://docs.typesafe.ai/cookbooks/entity_alignment"
sourceUpdated: 2026-09-20
difficulty: "advanced"
tags: ["entity-linking", "dedup", "master-data"]
primaryQuestion: "Score"
---

> 来源:docs.typesafe.ai/cookbooks/entity_alignment
> 抓取时间:2026-09-20

## 场景

两个产品目录(老 ERP + 新电商),需要判断哪些 product 是同一个。

## 方案

```python
# 一道 Score 题,3 个级别
resp = client.system_one(state=pair, questions={
    "decision": Score(
        ["merge - same product, link them",
         "leave unlinked - keep both",
         "curator - send to human review"],
        instructions="What should we do with this product pair?"
    )
})
```

3 个级别对应 3 种动作——没有阈值要调,模型直接告诉你"做这个"。

## 何时用

任何"两个集合里哪些项是同一个"的问题:客户去重、产品合并、地址规范化、记录对齐。
