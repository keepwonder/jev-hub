---
title: "Pre-parsed Extraction · regex 先粗筛,Jev 选 span"
description: "用 regex 先找出候选邮箱/电话/数字的位置,再用 Jev 在候选里挑出真正要的 span。在代码里规范化为最终值。"
source: "https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook"
sourceUpdated: 2026-09-20
difficulty: "beginner"
tags: ["extraction", "regex", "parsing"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook
> 抓取时间:2026-09-20

## 模式

```python
# 1. regex 提取所有候选
email_pattern = re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+')
candidates = email_pattern.findall(text)

# 2. 让 Jev 选
resp = client.system_one(state={"text": text, "candidates": candidates}, questions={
    "chosen": Choice(candidates, instructions="Which email is the customer's primary contact?")
})

# 3. 在代码里规范化
email = resp.chosen.choice.lower().strip()
```

## 何时用

任何"在文本里找一个具体值"的场景:Jev 擅长挑,不擅长从字符级别扫描;regex 擅长扫描,不擅长理解上下文。

组合起来:regex 给 Jev 缩小范围,Jev 给 regex 加上语义。
