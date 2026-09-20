---
title: "LangChain · Jev-as-a-Judge for Agent Evals"
author: "Daniel Shea & Seán Roche"
authorUrl: "https://blog.langchain.com/"
publisher: "LangChain Blog"
publisherUrl: "https://blog.langchain.dev/jev-as-a-judge/"
pubDate: 2026-09-19
description: "Jev 在 Agent Evals 上的正式基准:variance 比 GPT/Claude 低 92–913 倍,延迟 0.44s,成本 $0.34 总 vs Claude $28.17。"
category: "benchmark"
language: "en"
tags: ["基准", "LangChain", "evals"]
---

> 来源:[blog.langchain.com](https://blog.langchain.com)
> 抓取时间:2026-09-20

## 核心结论

- Jev 在**连续评分一致性**上碾压 GPT-5.6 Luna/Terra 和 Claude Sonnet 4.6
- quality-score variance **低 92–913 倍**
- 平均 **0.44 秒/调用**
- **$0.00035/调用**($0.34 总 vs Claude $28.17)

## 为什么重要

- Agent evals 今天两种形态:code-based(窄)+ LLM-as-judge(慢贵不一致)
- Jev 是**第三种**——type-safe、并行、快、便宜

## 立场

> "The results are promising, but early."

但**对 agent 评测是个新方向**。
