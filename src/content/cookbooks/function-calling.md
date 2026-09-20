---
title: "Function Calling · 自然语言转 typed function call"
description: "把'画 NVDA 和 SPY 的滚动相关性图'这种自然语言请求,转成 10 个 typed function 的精确调用,每个参数都带 confidence。"
source: "https://docs.typesafe.ai/cookbooks/function_calling"
sourceUpdated: 2026-09-20
difficulty: "advanced"
tags: ["function-calling", "agent"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/function_calling
> 抓取时间:2026-09-20

## 这是个完整的 production cookbook

`"plot rolling correlation between nvda and spy for the past month"`
→ `rolling_correlation(symbol='NVDA', benchmark='SPY', window='1mo') confidence 0.91`

`"compare nvda amd and msft over the past three months"`
→ `compare_returns(symbols=['NVDA','AMD','MSFT'], window='3mo') confidence 0.94`

## 核心思路

1. **每个函数的 `Literal` 参数自动变成 Choice 候选**
2. 用一个 `Dispatcher` 从函数签名 + spec 构造所有 questions
3. 每个自然语言命令 = 一次 API call,所有参数并行判断
4. `confidence = min(所有相关 question 的 confidence)`

## 性能

14 条命令的实测,平均 confidence 0.85+,全部正确路由到正确函数。

## 何时用

任何"自然语言 → 多个离散 API 参数"的场景,比如:

- 交易工具
- 数据库查询
- 工作流触发
- 设置变更
