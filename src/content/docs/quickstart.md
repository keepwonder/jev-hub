---
title: "Quickstart · 5 分钟跑通"
description: "申请 access → 第一次 API 调用 → 在 Playground 里试。"
source: "https://docs.typesafe.ai/introduction/quickstart"
sourceUpdated: 2026-09-20
category: "intro"
order: 1
---

> 镜像自 [docs.typesafe.ai/introduction/quickstart](https://docs.typesafe.ai/introduction/quickstart)
> 抓取时间:2026-09-20

## 1. 申请访问

去 [typesafe.ai](https://typesafe.ai) 点 Join Waitlist。X 上很多人几十分钟到 1 天过审。

## 2. 登录 Playground

通过审核后会收到邮件,登录 [console.typesafe.ai](https://console.typesafe.ai)。

## 3. 试一个问题

打开 Playground,把任意文本粘进 state。比如:

```
Hi, I've been trying to connect my Stripe account for 3 days and the integration keeps failing. I'm losing sales. Please help ASAP.
```

加一个问题:

```json
{
  "urgency": {
    "type": "noul",
    "instructions": "Does this message express urgency?"
  }
}
```

点 Run。几十毫秒后看到结果。

## 4. 加更多问题

试着混 Noul / Choice / Score 在一个 call 里,体验并行。

## 5. 用 API

在 dashboard 里拿 API key。然后用 SDK 或 curl 调用:

```bash
curl -X POST https://api.typesafe.ai/v1/system-one \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -d @your-request.json
```

完整 request schema 见 [API reference](/docs)。
