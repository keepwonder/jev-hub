---
title: "Classification with Confidence · 75 个行业自动分级"
description: "把 SEC 年报分到 75 个行业组。一道 Choice,根据 confidence 自动选:返回细分行业还是上一级大类。"
source: "https://docs.typesafe.ai/cookbooks/classification_using_confidence"
sourceUpdated: 2026-09-20
difficulty: "intermediate"
tags: ["classification", "hierarchical", "confidence"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/classification_using_confidence
> 抓取时间:2026-09-20

## 关键模式

```python
resp = client.system_one(state=annual_report, questions={
    "industry": Choice(list_of_75_SIC_industries, instructions="Which SIC industry?")
})

if resp.industry.confidence > 0.8:
    return resp.industry.choice  # 细分行业
else:
    return parent_industry(resp.industry.choice)  # 上一级大类
```

**用 confidence 当 fallback 触发器**——模型不确定时不要硬分类,优雅地降级。

## 何时用

任何"细分类 vs 大类"的取舍场景:
- 行业/产品/技能分类(置信度高→细分,低→大类)
- 路由(明确意图→精确路由,模糊意图→默认路由)
- 内容标签(精确标签 vs "其他")
