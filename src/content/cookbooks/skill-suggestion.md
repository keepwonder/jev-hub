---
title: "Skill Suggestion · 给 Agent 推荐下一个 skill"
description: "从 182 个 Hermes skills 里给 agent 的下一步动作选一个 skill。第一道 Choice 排前几名,第二道 Noul 二次确认是否需要 skill。"
source: "https://docs.typesafe.ai/cookbooks/skill_suggestion"
sourceUpdated: 2026-09-20
difficulty: "advanced"
tags: ["agent", "skill-routing", "mcp"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/skill_suggestion
> 抓取时间:2026-09-20

## 模式

```python
# Round 1: 选最可能的 skill
resp1 = client.system_one(state=turn, questions={
    "skill": Choice(list_of_182_skills, instructions="Best skill for this turn?")
})

# Round 2: 二次确认——是否真的需要 skill?
resp2 = client.system_one(state={"turn": turn, "candidates": top3}, questions={
    "needs_skill": Noul("Does this turn actually need a skill?"),
    "candidate_1_suits": Noul("Does skill #1 fit?"),
    "candidate_2_suits": Noul("Does skill #2 fit?"),
    "candidate_3_suits": Noul("Does skill #3 fit?"),
})
```

两道题组合用,比单题更准——**避免给简单对话硬塞 skill**。

## 何时用

任何 agent 在每一步选 tool/skill 的场景:Claude Code、Cursor、autonomous agent。
