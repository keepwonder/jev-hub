---
title: "Primitives · 三种问题类型"
description: "Choice / Score / Noul 的设计哲学与边界。"
source: "https://docs.typesafe.ai/primitives"
sourceUpdated: 2026-09-20
category: "primitives"
order: 1
---

> 镜像自 [docs.typesafe.ai/primitives](https://docs.typesafe.ai/primitives)
> 抓取时间:2026-09-20

TypeSafe 的原语是模块化、可组合、结构化、可靠、快速的小型构建块。每个原语问一种问题,返回一种答案。

## 三种类型

| 类型 | 问什么 | 返回 |
|---|---|---|
| **Choice** | 从列表里选一个 | choice, probabilities, confidence |
| **Score** | 在刻度上评分 | score, legend, probabilities, confidence |
| **Noul** | 是/否 | noul(0–1) |

一次请求可以混合多个问题,所有问题并行、独立评估。**加问题几乎不增加延迟**,也不会"context-rot"。

## 一次一个原子判断

System One 模型适合做**快速、聚焦**的判断。每个问题应该是"知情的人几秒能给出的判断"。

- ✓ "这条消息表达紧急吗?"
- ✗ "分析这条消息并决定最佳行动"(后者需要慢推理,应该拆成多个原子问题)

## 复合判断的拆法

如果你的判断依赖多个独立因子,**为每个因子单独问**,然后在代码里组合:

```python
# ❌ 不要:"评价这个 startup pitch"
# ✅ 拆开:
questions = {
    "market_size":   Score(["tiny","small","medium","large"], instructions="Market size?"),
    "feasibility":   Score(["impossible","hard","feasible","easy"], instructions="Tech feasibility?"),
    "differentiation": Score(["none","low","medium","high"], instructions="Differentiation?"),
}

# 在代码里加权
score = (
    resp.market_size.score * 0.4 +
    resp.feasibility.score * 0.3 +
    resp.differentiation.score * 0.3
)
```

当优先级变了,**改代码里的权重**,不用改 prompt。

## 定义问题

每个问题都有 ID、type、instructions:

- Choice 需要 options
- Score 需要 criteria
- Noul 可选 criteria
