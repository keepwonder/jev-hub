---
title: "Autoresearch · 自动发现数值特征"
description: "让 Jev 提议特征 → 转成数值 → 用模型错误训练监督学习(CatBoost)。AutoML 思路用在 feature engineering。"
source: "https://docs.typesafe.ai/cookbooks/autoresearch_feature_discovery"
sourceUpdated: 2026-09-20
difficulty: "advanced"
tags: ["feature-engineering", "automl", "ml-pipeline"]
primaryQuestion: "Score"
---

> 来源:docs.typesafe.ai/cookbooks/autoresearch_feature_discovery
> 抓取时间:2026-09-20

## 模式

```python
# 1. Jev 提议特征
resp = client.system_one(state=raw_data, questions={
    "good_feature": Noul("Is 'customer_sentiment_last_30_days' a useful feature for churn prediction?")
})

# 2. 把文本特征转成数值(用 LLM)
features[feat_name] = llm_to_numeric(raw_data[feat_name])

# 3. 用模型错误迭代
regressor.fit(features, labels)
# 用 error 找下一个该加的特征
```

## 何时用

- 没有结构化特征,需要从文本/对话里挖掘
- 经典 ML pipeline 的 feature engineering 阶段
- 想要"零样本特征提议"再人工筛选
