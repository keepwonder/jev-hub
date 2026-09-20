---
title: "07 · 四个杀手级应用"
description: "Agent Harness、RAG rerank、邮件分流、UI 内嵌 AI——4 个已经跑通的真实场景。"
pubDate: 2026-09-20
author: "Kiang"
tags: ["实战", "Agent", "RAG", "实时"]
order: 7
---

这一章列出 4 个"已经在生产里跑起来"的杀手级场景。每个都有可访问的代码、demo 或产品入口。

## 7.1 Agent Harness:替代 LLM 当"判断层"

**痛点**:Agent 每一步都要决定"下一步调哪个工具",每个判断都要调一次 LLM,慢且贵。

**方案**:把所有"是/否/选哪个/多紧急"换成 Jev 调用。

**效果**:agent 里的 LLM 调用次数减少 70–90%,延迟降低一个数量级。

### 代表项目: Browser Use 的 Jev Ultrafast

> 把网页拆成编号元素清单,让 Jev 选"做什么、对哪个"。

```python
# 简化版思路
elements = extract_clickable_elements(page_html)
decision = client.system_one(
    state={"page_title": page.title, "visible_elements": elements},
    questions={
        "next_action": Choice(
            ["click", "type", "scroll", "wait", "done"],
            instructions="What action should I take next?"
        ),
        "target":     Choice(
            [el.id for el in elements],
            instructions="Which element?"
        ),
    },
)
```

来源:[X 上的 Browser Use 实测帖](https://x.com/servasyy_ai/status/2101132667056185544)显示,机票搜索从 9.5 分钟缩短到 < 1 分钟。

## 7.2 RAG:高质量 rerank 替代品

**痛点**:embedding 检索的 top-k 经常有"语义接近但答非所问"的文档。传统做法是用一个 LLM judge 重新排序,但慢且贵。

**方案**:每个候选文档问一道 Choice 或 Score 题,让 Jev 排序。

```python
def jev_rerank(query: str, candidates: list[str]) -> list[int]:
    resp = client.system_one(
        state={"query": query, "candidates": candidates},
        questions={
            f"rel_{i}": Score(
                ["irrelevant", "tangentially relevant", "directly relevant"],
                instructions=f"How relevant is candidate {i} to the query?"
            )
            for i in range(len(candidates))
        }
    )
    # 按 score 降序排
    return sorted(
        range(len(candidates)),
        key=lambda i: resp[f"rel_{i}"].score,
        reverse=True
    )
```

**效果**:LangChain 的 [Jev-as-a-Judge 基准](https://x.com/LangChain/status/2101454284927959080)显示,Jev 做 judge 的 quality-score variance **比 GPT-5.6 Luna/Terra 和 Claude Sonnet 4.6 低 92–913 倍**,而且每调用 $0.00035(Claude 是 $0.05)。

## 7.3 邮件 / 工单分流

**痛点**:几千封邮件要分类,人工太慢,LLM 太贵。

**方案**:每封邮件问 3–5 个原子问题(团队、紧急度、是否退款、是否投诉、是否升级)。

```python
def classify_email(email: dict) -> EmailDecision:
    resp = client.system_one(
        state=email,
        questions={
            "team":       Choice(["billing","technical","account","shipping","other"],
                                 instructions="Which team handles this?"),
            "urgency":    Score(["low","medium","high","critical"],
                                instructions="How urgent?"),
            "needs_reply": Noul("Does this require a human reply?"),
            "is_complaint": Noul("Is the sender complaining?"),
        },
    )

    # 用 confidence 决定要不要人工复核
    needs_review = any(
        resp[qid].confidence < 0.7
        for qid in ["team","urgency","needs_reply","is_complaint"]
    )

    return EmailDecision(
        team=resp.team.choice,
        urgency=resp.urgency.score,
        needs_reply=resp.needs_reply.noul > 0.5,
        is_complaint=resp.is_complaint.noul > 0.5,
        needs_review=needs_review,
    )
```

**真实效果**(DeRonin_ 在 X 上的实测):
> **18,514 封邮件,98.33% 准确率,对比一个 TF-IDF 分类器(98.39%)。无训练数据,总计 $1.12。**

## 7.4 实时应用:UI 内嵌 AI

**痛点**:产品经理想在 UI 里加一个"实时判断"功能,比如"用户填完表单后实时提示信息"。

**方案**:用户每输入一个字段,前端发起一次 Jev 调用,~150ms 后给出建议。

**效果**:70ms–500ms 延迟 + 输出免费,**让"实时 AI"成为真正可行的产品形态**。

### 代表 demo:Doom bot

> 官方实测 Doom:每 100ms 一次决策,持续运行 ~$7/小时。

```python
# 简化版:游戏状态作为 state,动作作为 Choice
def doom_agent_step(game_state: dict):
    resp = client.system_one(
        state=game_state,
        questions={
            "action": Choice(
                ["move_forward","turn_left","turn_right","shoot","strafe"],
                instructions="What action should I take to survive?"
            ),
        },
    )
    return resp.action.choice
```

(注:Doom bot 不是真的"看"画面,而是接收游戏引擎的内部状态作为 state。这是"AI 反应速度快"的展示,**不是"AI 会玩游戏"**——Diogo 自己澄清过。)

## 横向对比

| 场景 | 之前用 LLM | 现在用 Jev | 提升 |
|---|---|---|---|
| Agent 工具选择 | GPT-5 × N 次/回合 | Jev × N 次/回合 | -95% 延迟,-99% 成本 |
| RAG rerank (top-20) | Claude × 20 次 | Jev × 1 次(批量) | -98% 延迟,-99.5% 成本 |
| 邮件分类 (1 万封) | GPT-5 × 1 万次 | Jev × 1 万次 | -99% 成本 |
| UI 实时提示 | 不可能(太慢) | 可行 | 新场景解锁 |

## 下一步

[第 08 章:常见误区 →](/tutorials/08-pitfalls)
