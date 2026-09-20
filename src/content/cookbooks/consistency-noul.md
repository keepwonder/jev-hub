---
title: "Self-consistency · Noul 不确定时转人工复核"
description: "为不确定的 Noul 答案自动路由到人工审核,同时保留模型返回的概率值供业务参考。"
source: "https://docs.typesafe.ai/cookbooks/consistency_noul_cookbook"
sourceUpdated: 2026-09-20
difficulty: "intermediate"
tags: ["self-consistency", "审核", "guardrail"]
primaryQuestion: "Noul"
---

> 来源:docs.typesafe.ai/cookbooks/consistency_noul_cookbook
> 抓取时间:2026-09-20

## 问题

Noul 返回的概率值在校准上很可靠,但单次调用仍有波动。什么时候把"低 confidence"自动升级到人工审核?

## 方案

```python
LOW = 0.6

def auto_with_review(noul: float) -> str:
    if noul < LOW:
        return 'route_to_human'
    if noul < 0.85:
        return 'partial_automation'
    return 'auto_execute'
```

## 关键洞察

- Noul 的概率本身就是校准的(比 LLM 的 confidence 准)
- 阈值不应该是固定的——根据风险等级动态调
- 把"低 confidence"路由到人,不是失败,是设计——**诚实比自动化重要**
