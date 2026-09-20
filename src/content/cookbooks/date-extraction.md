---
title: "Date Extraction · 拆年月日给 Choice"
description: "把日期文本按'年、月、日'拆成三个 Choice 问题,在代码里组装成 Date 对象。这样避开 Jev 不擅长日期算术的短板。"
source: "https://docs.typesafe.ai/cookbooks/date_extraction_cookbook"
sourceUpdated: 2026-09-20
difficulty: "beginner"
tags: ["extraction", "日期"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/date_extraction_cookbook
> 抓取时间:2026-09-20

## 关键思路

Jev 不擅长"两个日期哪个在前"——但擅长从"5月15日"提取月份和日期。

## 方案

```python
resp = client.system_one(state=text, questions={
    "year":  Choice(["2024","2025","2026","2027","not_stated"],
                    instructions="What year is mentioned?"),
    "month": Choice(["Jan","Feb",...,"Dec","not_stated"], instructions="What month?"),
    "day":   Choice([str(i) for i in range(1,32)] + ["not_stated"], instructions="What day?"),
})

# 在代码里组装
date = build_date(year, month, day)
# 然后做任意日期算术
```

## 何时用

任何从非结构化文本提取日期的场景:合同、邮件、新闻、聊天记录。
