---
title: "05 · Jev 不擅长什么(官方自己说的)"
description: "字面理解、不算术、不做日期、不生成、大 state 会污染——避开这 9 个坑。"
pubDate: 2026-09-20
author: "Kiang"
tags: ["入门", "限制", "jaggedness"]
order: 5
---

**这一章最该读**。TypeSafe 在文档里专门开了一页叫"Model Jaggedness",列举 Jev 1.13 的所有短板。这是其他 AI 公司极少做的事。

> **Jaggedness** — AI 模型的"参差不齐":擅长的很擅长,不擅长的很差劲。官方用这个词自嘲。

## 5.1 字面理解:它不揣摩你的"言外之意"

Jev 是"literal"的。你写"如果客户语气愤怒,标为 high",它真的只会**在客户显式表达愤怒**时返回 high。如果客户是反讽("哎呀,你们的服务真棒啊"配一个 30 分钟前的投诉),它大概率会判成"平静"。

**怎么办**:把条件写在 criteria 里,不要藏在 instruction 的修辞里。

```python
# ❌ 不好:藏在 instruction 的修辞里
Noul("Does the tone suggest sarcasm or hidden frustration?")

# ✅ 好:写死定义
Noul(
    instructions="Does the message contain phrases that mean the opposite of what is said?",
    criteria={
        "true": "The message uses words like 'wonderful', 'great', 'thanks' but the context implies complaint or anger",
        "false": "The message is taken at face value, no sarcasm indicators"
    }
)
```

## 5.2 不会做算术

"这封邮件提到几次'退款'?""这 3 笔订单哪个最贵?"——Jev 数不清。

**怎么办**:算术留给代码。Jev 拿到的应该是**预计算过的事实**,不是原始数据。

```python
# ❌ 不好:让 Jev 计数
Noul("Does this email mention 'refund' more than 2 times?")

# ✅ 好:在代码里计算,然后问 Jev
mention_count = email_text.lower().count('refund')
state_with_precomputed = {
    "email": email_text,
    "precomputed": {"refund_mention_count": mention_count}
}
Noul(f"Given that 'refund' is mentioned {mention_count} times in the email, is the customer likely to be unhappy?")
```

## 5.3 不会处理日期

"这两个日期哪个在前?""这个日期是不是过去 7 天内?"——Jev 处理日期也很糟糕。

**怎么办**:拆成 Choice 题,枚举年月,让代码去组装。

```python
# ❌ 不好
Noul("Is this date in the past 7 days: 2026-09-15?")

# ✅ 好:把日期拆开
Choice(
    instructions="What is the year of the date mentioned?",
    options=["2024", "2025", "2026", "2027", "not mentioned"]
)
# 然后在代码里组装、判断
```

## 5.4 不能生成文本

这一点最反直觉——**它根本不"写"**。

如果你问"为这个工单起草一封回信",它会给你一个很奇怪的结果(或者告诉你这超出了它的能力)。

**怎么办**:文本生成交给 GPT-5 / Claude。Jev 只负责"判断要不要起草"。

```python
# ✅ 好:Jev 决定要不要起草,LLM 负责起草
decision = client.system_one(
    state=conversation,
    questions={
        "should_reply":  Noul("Should we proactively send a follow-up reply?"),
        "tone":          Choice(["apology","thanks","info","none"],
                                instructions="What tone?"),
    },
)

if decision.should_reply.noul > 0.7:
    # 交给 LLM 去生成文本
    reply = llm.generate(build_prompt(conversation, decision.tone.choice))
    send(reply)
```

## 5.5 大 state 里掺干扰,准确率会掉

把一整页 HTML 塞进 state,让 Jev 判断"用户点了哪个按钮"——它的准确率会比只给它"按钮列表"低很多。

**怎么办**:在代码里检索、过滤、提取,只把相关字段给 Jev。

```python
# ❌ 不好:把整页 HTML 塞进去
state = full_html_page
question = Noul("Did the user click the 'Buy' button?")

# ✅ 好:在代码里提取按钮列表
buttons = extract_buttons(full_html_page)
state = {"available_buttons": buttons, "last_clicked": last_click}
question = Noul("Was the most recently clicked button 'Buy'?")
```

## 5.6 没有多模态(目前)

只能吃文本。图片、音频、视频目前不支持。

**怎么办**:用其他模型做 OCR / 语音转文字,然后把文本给 Jev。

## 5.7 不记上下文累积

每次调用都是独立的——它不"记得"上一次调用。

**怎么办**:把对话历史打包进 state。

## 5.8 中文准确率低于英文

官方 jaggedness 报告明确说:**Jev 的主要训练语言是英文,其他语言(包括 CJK)目前准确率较低**。

**怎么办**:中文场景要拿真实样本盲测,不要直接照搬英文 prompt。

## 5.9 不能"反问"或"质疑"

你给 Jev 一个前提,如果前提里有错,它不会纠正。它会基于你给的前提老老实实做判断。

**怎么办**:在 system 层面做事实检查,不要指望 Jev 自己发现矛盾。

## 一张速查表

| 任务 | 用 Jev? | 替代 |
|---|---|---|
| 在 5 个选项里选一个 | ✅ | — |
| 在有序刻度上打分 | ✅ | — |
| 是/否 | ✅ | — |
| 写一封邮件 | ❌ | GPT-5 / Claude |
| 写代码 | ❌ | GPT-5 / Claude |
| 数次数 | ❌ | 代码正则 |
| 日期算术 | ❌ | 代码 datetime |
| 看图片 | ❌ | OCR 后给 Jev |
| 多轮对话上下文管理 | ❌ | 把历史打包进 state |
| 反问用户 | ❌ | 代码逻辑 |

## 下一步

[第 06 章:从 0 到跑通 →](/tutorials/06-quickstart)
