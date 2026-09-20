---
question: "Jev 的 confidence 真的可信吗?"
answer: "**在群体层面是的**。Jev 经过 RLCD 训练,它的 confidence 是**校准的**——说 0.8 confidence 的题长期看 80% 是对的。

但**单条不保证**。说 0.95 confidence 的某一条,这次可能恰好错。

实操建议:
1. 用 confidence 阈值做门控(参考 [Confidence 计算器](/tools/confidence-calculator))
2. 在自己的样本上跑校准曲线
3. 关键场景做 A/B 对照"
category: "general"
order: 5
---
