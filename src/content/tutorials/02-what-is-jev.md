---
title: "02 · Jev 是什么:三句话讲清楚"
description: "不写文章、只会答三种题、第一款 System One Model。"
pubDate: 2026-09-20
author: "Kiang"
tags: ["入门", "概念", "System One"]
order: 2
---

这一章我们用三句话把 Jev 钉死在你的认知里。

## 第一句话:Jev 不写文章

> **Jev 是一个只做"判断"、不"说话"的 AI。**

你给它一段材料(邮件正文、工单内容、代码 diff、一段游戏状态),它给你**结构化的答案**,不带任何修饰语。

- 不会说"我认为是 billing"
- 不会说"考虑到您的需求,建议选择 technical"
- 不会说"作为一个 AI 助手,我建议……"

它给你:`{"route": "billing", "confidence": 0.92}`

就这一行。

## 第二句话:Jev 只会答三种题

不管你问什么,都脱不开这三种题型:

| 题型 | 问什么 | 返回什么 | 例子 |
|---|---|---|---|
| **Choice** | 从一个列表里选一个 | 选中的值 + 每个选项的概率 + confidence | "这封邮件属于哪个团队?billing / technical / account" |
| **Score** | 在一个有顺序的刻度上打分 | 分数(可落在级别之间)+ 每级概率 + confidence | "这封邮件多紧急?0=不急,1=有点急,2=非常急,3=催命" |
| **Noul** | 是还是不是 | 一个 0 到 1 的概率(是的概率) | "这封邮件是不是在要退款?" |

而且,**所有问题可以一次问完,并行评估**。如果你有 5 个判断要做,你写 5 个问题,一次调用,5 个答案。

```python
response = client.system_one(
    state=email_text,
    questions={
        "team":       Choice(["billing", "technical", "account"], instructions="Which team?"),
        "urgency":    Score([0, 1, 2, 3], instructions="How urgent?"),
        "refund":     Noul("Is the customer requesting a refund?"),
        "angry":      Noul("Does the tone suggest strong frustration?"),
        "spam":       Noul("Is this spam or marketing?"),
    }
)
# 一次调用,5 个答案,5 个 confidence,几十毫秒
```

## 第三句话:Jev 是 TypeSafe 提出的"System One Model"的第一款

System One 这个名字借自 Daniel Kahneman 的《思考,快与慢》——

- **System 1** 是快速、凭直觉的判断(看到红灯就停)
- **System 2** 是慢速、需要推理的思考(解一道微积分)

Jev 是"AI 版的 System 1":快、稳、不解释。

而今天所有聊天模型都是 System 2:慢、烧脑、会自言自语。

TypeSafe 的赌注是:**未来的软件系统,会把"判断"和"思考"分清楚**——让 System 2 模型(大模型)负责"想",让 System 1 模型(Jev)负责"判断"。两者在代码里组合。

> 这就是 Jev 的产品哲学。它不是来"取代"GPT-5 的;它是来补上 GPT-5 不擅长那一块的。

## 一张图总结

```
┌─────────────────────────────────────────────────────────┐
│                你的软件系统                              │
│                                                         │
│   ┌──────────────┐         ┌──────────────┐            │
│   │   System 2    │  ←──→   │   System 1   │            │
│   │  (大模型)      │         │   (Jev)      │            │
│   │              │         │              │            │
│   │ • 生成文本    │         │ • 做选择      │            │
│   │ • 写代码      │         │ • 打分        │            │
│   │ • 推理        │         │ • 是/否      │            │
│   │ • 解释        │         │ • 不解释      │            │
│   │              │         │              │            │
│   │ GPT-5        │         │ Jev          │            │
│   │ Claude       │         │              │            │
│   │ Gemini       │         │              │            │
│   └──────────────┘         └──────────────┘            │
│                                                         │
│   代码掌控控制流,AI 只在"判断"环节嵌入                    │
└─────────────────────────────────────────────────────────┘
```

## 下一步

[第 03 章:三种题型精讲 →](/tutorials/03-three-question-types)
