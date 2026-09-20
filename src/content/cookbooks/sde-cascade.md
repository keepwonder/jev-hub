---
title: "SDE Cascade · 用 mini 模型拿 reasoning 模型 90% 的质量"
description: "mini 模型跑一遍结构化抽取 → 验证关键字段 → 不确定时才升级到 reasoning 模型。省 10× 成本,保留大部分质量。"
source: "https://docs.typesafe.ai/cookbooks/sde_cascade"
sourceUpdated: 2026-09-20
difficulty: "advanced"
tags: ["cascade", "cost-optimization", "extraction"]
primaryQuestion: "Score"
---

> 来源:docs.typesafe.ai/cookbooks/sde_cascade
> 抓取时间:2026-09-20

## 模式

```python
# Stage 1: 用 Jev 做抽取(便宜)
resp = client.system_one(state=doc, questions={
    "fields": Score(["complete","partial","missing"], instructions="How complete is the extraction?")
})

# Stage 2: 只在 confidence 低时升级
if resp.fields.confidence < 0.85:
    resp = expensive_reasoning_model.extract(doc)
```

## 关键洞察

Jev 适合做**校准的"quality gate"**——它的 confidence 告诉你"该信还是该升级"。

## 何时用

任何"先用便宜模型跑、只在不确定时升级"的成本优化场景:文档抽取、数据迁移、表单解析。
