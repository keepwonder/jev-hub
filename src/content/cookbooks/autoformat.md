---
title: "Structure Recovery · 从纯文本重建 Markdown"
description: "两阶段:第一阶段缝合被硬换行破坏的段落,第二阶段用 Jev 给每个块分类(标题/列表/代码/引用)。"
source: "https://docs.typesafe.ai/cookbooks/autoformat"
sourceUpdated: 2026-09-20
difficulty: "intermediate"
tags: ["formatting", "parsing", "extraction"]
primaryQuestion: "Choice"
---

> 来源:docs.typesafe.ai/cookbooks/autoformat
> 抓取时间:2026-09-20

## 模式

```python
# Phase 1: 重新拼接硬换行
joined = client.system_one(state={"text": raw_text}, questions={
    "join_lines": Noul("Should these two lines be joined into one paragraph?")
})

# Phase 2: 给每个块分类
for block in blocks:
    resp = client.system_one(state=block, questions={
        "kind": Choice(["heading","paragraph","list","code","quote","other"],
                       instructions="What kind of markdown block is this?")
    })
```

## 何时用

- 把 OCR 结果 / 复制粘贴的网页 / 旧文档转回 Markdown
- 恢复被错误 wrap 的代码块
- 自动给博客文章加结构
