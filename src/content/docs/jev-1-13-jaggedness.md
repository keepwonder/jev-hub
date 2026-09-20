---
title: "Jev 1.13 · Jaggedness"
description: "Jev 1.13 已知短板:字面阅读、不算术、不做日期、不生成、大 state 衰减……"
source: "https://docs.typesafe.ai/model-jaggedness/jev-1.13"
sourceUpdated: 2026-09-20
category: "rules"
order: 1
---

> 镜像自 [docs.typesafe.ai/model-jaggedness/jev-1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
> 抓取时间:2026-09-20

## 概览

`jev-1.13` 快速、校准,在常识判断上很强,但不完美。它在 System One 任务上表现最佳,对需要多跳推理的任务吃力。它会**字面**理解。对数字精度任务也吃力。

## 失败模式速查

| # | 失败模式 | 怎么办 |
|---|---|---|
| 1 | **字面阅读** — 它答你写的,不是你"想的" | 把条件写死在 instructions,边界写进 criteria |
| 2 | **数学和数字** — 不计数 | 算术留给代码 |
| 3 | **日期比较** — 日期当文本读 | 拆部件用 Choice,代码组装 |
| 4 | **间接推理** — 多跳推理吃力 | 减少跳数,直接指向相关 state |
| 5 | **大 state 掺干扰** — 准确率下降 | 先在代码里过滤,只发需要的字段 |
| 6 | **对抗内容** — 它不把 state 当 hostile | 在 criteria 里显式约束,部署前压测 |
| 7 | **矛盾的 instructions 和 criteria** | 让两者对齐 |
| 8 | **结构不变式**(同一问题 Noul 和 Choice 结果"应该"互补) | 不要假设;按字面问 |
| 9 | **生成文本** — 不是为生成训的 | 用别的模型 |

## 字面阅读(详细)

它答你**写**的,不是你**想**的。范围词、否定词、隐含条件都被字面读。

问:对 `I'm not happy with the fit. What are my options here?`,问"客户在要退款吗?"

| Noul `noul` | Choice `yes` | Choice `no` | Choice `confidence` |
|---|---|---|---|
| 0.22 | 0.01 | 0.99 | 0.97 |

> Noul 给 0.22(不是要退款),Choice 给 `yes: 0.01`(也不"是"),两者并不严格互斥。

**怎么办**:不要假设 Noul 和 Choice 等价;按字面语义问。

## 数学

不计数。不管是单词字符数、passage 里关键词出现次数、还是长 list 里的项目数。

```python
# ❌ 不好
items_count = Noul(f"Does this list have more than 5 items? {items}")

# ✅ 好
state_with_count = {"items": items, "precomputed_count": len(items)}
Noul(f"Given there are {len(items)} items, is the list big?")
```

## 日期时间

把日期当文本读,不按有序量。问"两个日期哪个在前"、"两个日期相差多久"不可靠。

```python
# ✅ 好的模式:拆出"年、月",用 Choice 枚举
Choice(["2024","2025","2026","2027","not stated"], instructions="Year?")
```

## 间接推理

带双重否定或复杂间接的 instructions 答得差。

**怎么办**:直接写,尽可能按名指向相关 state 字段。

## 大 state 掺干扰

无关内容稀释注意力。state 越大,越难定位错误原因。

**怎么办**:
- 先在代码里检索过滤
- 只发 question 需要的字段
- 必要时用 Noul 做"是否相关"的预过滤(参考 [Classifying RAG Passages cookbook](/cookbooks/classifying-rag-passages))

## 对抗内容

state 是数据,Jev 默认不把它当 hostile。注入指令、误导框架、自论证分类的文本可能改变答案。

**怎么办**:在 criteria 里显式约束;大量部署前充分压测。

## 矛盾 instructions / criteria

如果 instructions 和 criteria 要的不一样,Jev 可能糊涂。

**怎么办**:把 criteria 当 instructions 的延伸,语言清晰一致。

## 生成

不训练生成文本。可以强制让它"链式 Choice"模拟生成,但效果差且慢。

**怎么办**:要生成,用别的模型。

## 一句话总结

> Jev 的 jaggedness 总结成一句话:**"判断可以,计算不行。"**
