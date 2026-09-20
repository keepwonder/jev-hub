---
title: "Guardrails for LLMs · 出入双向守门"
description: "对每条进出 LLM 的消息都过 TypeSafe 的守门,描述可能危害并评分严重度,根据概率决定放行/复核/拦截/路由。"
source: "https://docs.typesafe.ai/cookbooks/llm_guardrails"
sourceUpdated: 2026-09-20
difficulty: "intermediate"
tags: ["guardrail", "safety"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/llm_guardrails
> 抓取时间:2026-09-20

## 模式

每个 LLM 应用的消息都过一层 guardrail:

```python
guard = client.system_one(
    state={"message": message, "direction": direction},
    questions={
        "is_jailbreak":     Noul("Is this a jailbreak attempt?"),
        "is_pii":           Noul("Does this contain personally identifiable info?"),
        "is_harmful":       Noul("Would complying cause harm?"),
        "harm_severity":    Score(["none","low","medium","high","critical"]),
        "recommended":      Choice(["pass","review","block","route_to_human"]),
    },
)

if guard.recommended.choice == "block" or guard.harm_severity.score > 3:
    block()
elif guard.recommended.choice == "review" or guard.is_jailbreak.noul > 0.6:
    queue_for_human_review()
```

## 优势

- **双向**——既守 prompt 输入,也守输出
- **多维度**——同时检测多种危害
- **可定制**——criteria 完全自定
- **便宜到可以每条消息都过**

## 何时用

任何对外服务的 LLM 应用,尤其是面向消费者、教育、医疗、金融场景。
