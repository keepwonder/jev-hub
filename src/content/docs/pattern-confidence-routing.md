---
title: "Pattern · Confidence-Gated Routing"
description: "把 confidence 当第二决策轴,实现更安全的自动系统。"
source: "https://docs.typesafe.ai/patterns/confidence-routing"
sourceUpdated: 2026-09-20
category: "patterns"
order: 2
---

> 镜像自 [docs.typesafe.ai/patterns/confidence-routing](https://docs.typesafe.ai/patterns/confidence-routing)
> 抓取时间:2026-09-20

## 核心思想

Confidence 不是"准不准"的指标,而是"是否值得行动"的门控。

## 三段式阈值

```python
HIGH = 0.85
LOW  = 0.50

if answer.confidence < LOW:
    escalate_to_human()
elif answer.confidence < HIGH:
    ask_user_to_confirm()
else:
    act_automatically()
```

| 区间 | 系统行为 |
|---|---|
| 高 confidence | 自动执行 |
| 中 confidence | 让用户确认 / 排队复核 |
| 低 confidence | 不执行,转人工或回退 |

风险越高,阈值越高。

## 阈值随风险动态调

- 自动回复"我们收到了"——0.55 够
- 触发退款流程——0.85
- 扣款 / 转账——0.95+
- 关账户 / 法律动作——0.98+

## 为什么 confidence 比答案更值得信

如果模型对了 95% 但**不知道它何时对了**,它不能自动化。
Jev 的 confidence 是**校准**的:0.8 confidence 长期 ≈ 80% 准确。

## 配合 retry / fallback

confidence < LOW 时,可以选择:
1. 转人工
2. 收集更多上下文
3. 调用更大的模型
4. 用不同 question 重新问

## 与其他 pattern 配合

- **Speculative Fan-Out** — 一次问一堆 question,留 confidence 高的
- **Composite Scoring** — 用 confidence 决定要不要加权
- **Intent Routing** — 路由的信心低时让用户重新表达意图
