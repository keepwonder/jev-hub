---
title: "Self-consistency · Choice 标签一致性"
description: "Choice 决策的稳定性测试:同一问题多次跑,看 confidence 是否一致。比较自动动作 vs 人工复核的占比。"
source: "https://docs.typesafe.ai/cookbooks/consistency_choice_cookbook"
sourceUpdated: 2026-09-20
difficulty: "intermediate"
tags: ["self-consistency", "审核"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/consistency_choice_cookbook
> 抓取时间:2026-09-20

## 模式

对同一段 state 跑 N 次 Choice,统计:
- 选中 label 的稳定率
- confidence 的方差
- 多次跑结果不一致时,自动升级到人工

```python
results = [client.system_one(state, questions).choice.choice for _ in range(5)]
stability = results.count(mode(results)) / len(results)
if stability < 0.8:
    escalate_to_human()
```

## 何时用

任何需要**高一致性**的分类场景:内容审核、意图识别、自动路由。
