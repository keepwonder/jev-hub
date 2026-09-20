---
title: "大多数谈论 JEV 的人从未读过定价页面之后的任何内容"
author: "@cyrilXBT"
authorUrl: "https://x.com/cyrilXBT"
publisher: "X (Twitter)"
publisherUrl: "https://x.com/cyrilXBT/status/2101634985631658180"
pubDate: 2026-09-20
description: "10 条文档里没明说的事:并行采样、状态污染、Vercel SDK 的 confidence 位置等。"
category: "analysis"
language: "en"
tags: ["内幕", "架构", "Vercel"]
---

> 来源:[x.com/cyrilXBT/status/2101634985631658180](https://x.com/cyrilXBT/status/2101634985631658180)
> 抓取时间:2026-09-20

10 个关键洞察:

1. **Doom 持续运行 ~$7/小时**(每秒 10 个决策)
2. **不是自回归**——并行采样器
3. **硬上限**:Choice ≤ 255、Score 2–10 级、Noul 无 confidence
4. **state + 最长 question 合计 ≤ ~32K tokens**
5. **批处理便宜 12.2×、快 10×**
6. **最大错误:让 Jev 提取或生成**
7. **不计数、不做日期、不比较版本**
8. **state 污染**(不是 context rot)
9. **Vercel AI SDK 上 confidence 在 `result.providerMetadata.typesafe.confidence`**
10. **输出免费**(300-token 分类 ~$0.0000126)
