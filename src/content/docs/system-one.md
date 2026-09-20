---
title: "System One · 概念"
description: "System One 模型是什么,跟 LLM 有什么本质区别。"
source: "https://docs.typesafe.ai/concepts/system-one"
sourceUpdated: 2026-09-20
category: "concepts"
order: 1
---

> 镜像自 [docs.typesafe.ai/concepts/system-one](https://docs.typesafe.ai/concepts/system-one)
> 抓取时间:2026-09-20

## 一句话

System One 模型是为软件做快速结构化决策而设计的 AI。Jev 是 TypeSafe 的旗舰模型,也是第一款 System One 模型。

## 和 LLM 的区别

| | LLM | System One(Jev) |
|---|---|---|
| 输出 | 文本字符串 | 类型化决策 + 概率 |
| 训练目标 | RLHF / RLVR(偏好 / 可验证) | RLCD(校准决策) |
| 推理 | 自回归(token by token) | 并行采样 |
| 延迟 | 3–329 秒 | 70–500 ms |
| 适合 | 聊天、写代码、推理 | 分类、路由、评分 |

## 三个原语

| Primitive | 问什么 | 例 |
|---|---|---|
| Choice | 从列表里选一个 | "哪个团队?" → billing/technical/... |
| Score | 在有序刻度上打分 | "多紧急?" → 0..3 |
| Noul | 是还是不是 | "请求退款?" → 0.95 |

## 上下文窗口

Jev 1.13 当前只吃文本输入。Image / audio / video 暂不支持。

state 字段可以是 string、object 或 array。多个 questions 共享同一个 state,并行评估。
