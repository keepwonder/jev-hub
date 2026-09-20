---
title: "06 · 从 0 到跑通"
description: "申请 waitlist、第一次 API 调用、Python SDK、Agent Harness 集成,完整 5 步上手。"
pubDate: 2026-09-20
author: "Kiang"
tags: ["入门", "实战", "API", "SDK"]
order: 6
---

## 6.1 申请访问

Jev 目前是邀请制。流程:

1. 打开 https://typesafe.ai
2. 点击 "Join Waitlist"
3. 填写申请——**重点**:写清楚你打算用 Jev 做什么(不是"研究 AI",而是具体场景)
4. 等待邮件邀请——根据 X 上的反馈,**几十分钟到 1 天**通过很常见
5. 通过后登录 https://console.typesafe.ai,生成 API Key

> **替代路径**:如果你不想等,**OpenRouter 已经上线了 `typesafe/jev`**,可以直接用 OpenRouter 的 key 调用。

## 6.2 第一次 API 调用(REST)

用 curl 试一下:

```bash
curl -X POST https://api.typesafe.ai/v1/system-one \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "jev-1.13",
    "state": "I was charged twice for order A-104. Please refund the duplicate ASAP.",
    "questions": {
      "refund":  {"type": "noul", "instructions": "Does the customer request a refund?"},
      "team":    {"type": "choice",
                  "instructions": "Which team handles this?",
                  "options": ["billing","technical","account","shipping"]},
      "urgency": {"type": "score",
                  "instructions": "How urgent?",
                  "criteria": ["not urgent","slightly","urgent","losing money"]}
    }
  }'
```

返回大概长这样(数值示意):

```json
{
  "answers": {
    "refund":  {"noul": 0.97},
    "team":    {"choice": "billing",
                "probabilities": {"billing":0.95,"technical":0.03,"account":0.01,"shipping":0.01},
                "confidence": 0.95},
    "urgency": {"score": 2.7,
                "legend": {"0":"not urgent","1":"slightly","2":"urgent","3":"losing money"},
                "probabilities": {"0":0.02,"1":0.05,"2":0.30,"3":0.63},
                "confidence": 0.63}
  },
  "usage": {"input_tokens": 24, "output_tokens": 0}
}
```

注意:`output_tokens` 是 0——**因为它根本不生成 token**。这就是"输出免费"的根本原因。

## 6.3 Python SDK(推荐)

```bash
pip install typesafe-sdk --extra-index-url https://pypi.typesafe.ai/
```

```python
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

client = TypeSafeClient()  # 读 TYPESAFE_API_KEY 环境变量

response = client.system_one(
    state="I was charged twice for order A-104. Please refund the duplicate ASAP.",
    questions={
        "refund":  Noul("Does the customer request a refund?"),
        "team":    Choice(["billing","technical","account","shipping"],
                          instructions="Which team?"),
        "urgency": Score(["not urgent","slightly","urgent","losing money"],
                         instructions="How urgent?"),
    },
)

print(response["team"].choice)        # "billing"
print(response["urgency"].score)      # 2.7
print(response["urgency"].confidence) # 0.63
```

### JavaScript / TypeScript

```bash
npm install typesafe-sdk
```

```ts
import { TypeSafeClient, Choice, Noul, Score } from 'typesafe-sdk';

const client = new TypeSafeClient();

const response = await client.systemOne({
  state: 'I was charged twice for order A-104.',
  questions: {
    refund:  Noul('Customer requests refund?'),
    team:    Choice(['billing','technical','account','shipping'], { instructions: 'Which team?' }),
    urgency: Score(['not urgent','slightly','urgent','losing money'], { instructions: 'How urgent?' }),
  },
});

console.log(response.team.choice);
```

## 6.4 在 Agent Harness 里用(杀手级场景)

Jev 在 agent 里最有价值的位置是**每个工具调用前的判断**。

```python
def agent_loop(user_request):
    # 1. 让 Jev 决定:要不要先查数据库?
    decision = client.system_one(
        state=user_request,
        questions={
            "needs_db":  Noul("Does answering this require looking up user data?"),
            "needs_web": Noul("Does answering this require a web search?"),
            "intent":    Choice(["question","task","complaint","chitchat"],
                                instructions="What is the user trying to do?"),
        },
    )

    # 2. confidence-gated routing
    if decision.needs_db.noul > 0.8:
        data = query_db()
    else:
        data = None

    # 3. 用大模型生成回复
    response = llm.generate(
        prompt=build_prompt(user_request, data, decision.intent.choice),
    )
    return response
```

**关键:不要让大模型去做"要不要查库"的判断**——这本来就是个选择题,而且 LLM 在这种"是/否"问题上的 confidence 也不准。Jev 既快又便宜、还老实。

## 6.5 confidence-gated routing(进阶模式)

```python
HIGH = 0.85   # 自信,自动执行
LOW  = 0.50   # 不确定,转人工

if answer.confidence < LOW:
    escalate_to_human()
elif answer.confidence < HIGH:
    ask_user_to_confirm()
else:
    act_automatically()
```

这个三段式阈值是官方推荐用法,**根据风险动态调整阈值**——自动扣款可能要 0.95+,自动回复"我们收到了"可能 0.7 就够。

### 阈值计算器

试试我们的 [Confidence 阈值计算器](/tools/confidence-calculator):输入风险等级和动作成本,自动算出建议阈值。

## 下一步

[第 07 章:四个杀手级应用 →](/tutorials/07-killer-uses)
