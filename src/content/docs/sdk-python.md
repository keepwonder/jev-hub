---
title: "Python SDK"
description: "typesafe-sdk 安装、异步/同步客户端、错误处理。"
source: "https://docs.typesafe.ai/sdk/python"
sourceUpdated: 2026-09-20
category: "sdk"
order: 1
---

> 镜像自 [docs.typesafe.ai/sdk/python](https://docs.typesafe.ai/sdk/python)
> 抓取时间:2026-09-20

## 安装

```bash
pip install typesafe-sdk --extra-index-url https://pypi.typesafe.ai/
```

## 设置 API key

```bash
export TYPESAFE_API_KEY="ts-..."
```

或在代码里:

```python
from typesafe_sdk import TypeSafeClient
client = TypeSafeClient(api_key="ts-...")
```

## 同步客户端

```python
from typesafe_sdk import TypeSafeClient, Choice, Noul, Score

client = TypeSafeClient()

response = client.system_one(
    state="I was charged twice for order A-104.",
    questions={
        "refund":  Noul("Customer requests refund?"),
        "team":    Choice(["billing","technical","account","shipping"]),
        "urgency": Score(["not urgent","slightly","urgent","critical"]),
    },
)

print(response["refund"].noul)
print(response["team"].choice)
print(response["urgency"].score)
```

## 异步客户端

```python
from typesafe_sdk import AsyncTypeSafeClient

async def classify(email: str):
    async with AsyncTypeSafeClient() as client:
        return await client.system_one(
            state=email,
            questions={...},
        )
```

## 错误处理

```python
from typesafe_sdk import (
    AuthenticationError, RateLimitError, APITimeoutError,
)

try:
    response = client.system_one(state=..., questions=...)
except RateLimitError:
    time.sleep(60)
    # retry
except APITimeoutError:
    # backoff + retry
```

## 重试策略

```python
client = TypeSafeClient(
    retry_policy={
        "max_attempts": 3,
        "initial_delay": 1,
        "max_delay": 30,
    }
)
```

## Token 用量

```python
response = client.system_one(...)
print(response.usage.input_tokens)   # input
print(response.usage.output_tokens)  # always 0
```
