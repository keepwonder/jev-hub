---
question: "Jev 真的不能计数吗?"
answer: "**不能**。无论是字符数、关键词出现次数,还是 list 里的项目数。

**怎么办**:在代码里算,然后把数字作为 state 的一部分传给 Jev。Jev 拿到的应该是**预计算的事实**,不是原始数据。

```python
state = {
    \"items\": items,
    \"precomputed_count\": len(items),  # ← 在代码里算
}
question = Noul(f\"Given there are {len(items)} items, is this a large list?\")
```"
category: "limits"
order: 9
---
