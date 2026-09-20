# Jev Hub — jev.kiang.website

> Jev / TypeSafe AI 中文跟踪与文档聚合站
> Built with [Astro](https://astro.build) · [Tailwind CSS](https://tailwindcss.com) · [Pagefind](https://pagefind.app)

## ✨ 功能(P0 + 大部分 P1)

- **官方动态流** — @typesafeai + 创始人 @CompleteSkeptic 最新推文
- **X 讨论墙** — 7 个关键词 × 2 排序,自动聚合社区讨论
- **官方文档镜像** — docs.typesafe.ai 同步索引
- **Cookbook 索引** — 20 个实战案例,带难度/题型筛选
- **SDK 版本监控** — Python / JavaScript / .NET 发版记录
- **Jev 版本历史** — jaggedness 报告 + 版本 changelog
- **9 篇从入门到实战的系列教程**
- **工程工具** — Confidence 阈值计算器(交互)、Cheatsheet 速查表
- **横向对比** — Jev vs OpenAI Structured Outputs / Inception / DeepSeek / vLLM 等
- **完整术语表 / FAQ**
- **社区项目墙** — GitHub stars 自动刷新
- **深浅色主题** + **中英术语兼容**
- **Cmd+K 全局搜索**(Pagefind)
- **本地收藏**(localStorage,无需登录)
- **RSS 订阅** + Sitemap

## 🚀 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → http://localhost:4321

# 抓数据(可选,需要 X cookies)
npm run fetch:x
npm run fetch:github
npm run fetch:hn

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📁 项目结构

```
site/
├── astro.config.mjs       # Astro 配置
├── tailwind.config.mjs    # Tailwind 配色
├── tsconfig.json
├── package.json
├── .github/workflows/
│   ├── fetch-data.yml     # 每 6 小时抓数据
│   └── deploy.yml         # 部署到 Cloudflare Pages
├── scripts/
│   ├── fetch-x.ts         # X 抓取(需要登录态)
│   ├── fetch-github.ts    # GitHub stars
│   ├── fetch-hn.ts        # HN Algolia API
│   ├── fetch-docs.ts      # 文档镜像(占位)
│   └── fetch-cookbooks.ts # Cookbook 镜像(占位)
├── public/
│   ├── favicon.svg
│   └── robots.txt
└── src/
    ├── components/        # Astro 组件
    ├── content/           # 内容集合(MDX/MD)
    │   ├── tutorials/     # 9 篇教程
    │   ├── docs/          # 官方文档镜像
    │   ├── cookbooks/     # Cookbook 镜像
    │   ├── articles/      # 第三方文章
    │   ├── faqs/          # FAQ
    │   ├── glossary/      # 术语表
    │   └── versions/      # Jev 版本 changelog
    ├── data/              # 抓取的 JSON 数据
    │   ├── official-tweets.json
    │   ├── founder-tweets.json
    │   ├── recent-discussions.json
    │   ├── awesome-typesafe.json
    │   └── hn-discussions.json
    ├── layouts/
    │   └── BaseLayout.astro
    ├── pages/             # 路由
    │   ├── index.astro
    │   ├── discussions.astro
    │   ├── tutorials/
    │   ├── cookbooks/
    │   ├── docs/
    │   ├── articles/
    │   ├── community.astro
    │   ├── compare.astro
    │   ├── faqs.astro
    │   ├── changelog.astro
    │   ├── glossary.astro
    │   ├── tools/
    │   ├── about.astro
    │   ├── rss.xml.ts
    │   └── 404.astro
    └── styles/
        └── global.css
```

## 🌐 部署到 Cloudflare Pages + jev.kiang.website

### 1. 把代码推到 GitHub

```bash
git init
git add .
git commit -m "init: jev hub"
gh repo create jev-hub --public --source=. --push
# 或者手动 push 到你自己的仓库
```

### 2. Cloudflare Pages 绑定

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 选择你的仓库
4. **Build settings**:
   - Build command:`cd site && npm run build`
   - Build output directory:`site/dist`
   - Root directory:`(leave blank)`
   - Environment variables:`NODE_VERSION=20`
5. **Save and Deploy**

### 3. 绑定 jev.kiang.website

1. Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入 `jev.kiang.website`
3. 如果 kiang.website 已在 Cloudflare —— **会自动**添加 CNAME,不需要手动操作
4. 如果 kiang.website 不在 Cloudflare —— 需要到域名注册商添加 `jev` CNAME 指向 `<your-project>.pages.dev`

### 4. Secrets(可选,用于 X 抓取)

在仓库 Settings → Secrets and variables → Actions:

- `X_COOKIES_JSON`:从浏览器导出的 X.com cookies(JSON 格式)
- `CLOUDFLARE_API_TOKEN`:用于部署
- `CLOUDFLARE_ACCOUNT_ID`:你的 Cloudflare 账户 ID

## 🎨 设计原则

- **类型安全优先** — 所有 schema 严格
- **暗色模式默认跟系统** + 手动切换
- **无 JS 也能用** — 内容静态生成,只有交互(搜索、主题、收藏)用 JS
- **性能** — 静态 HTML + 最小 JS,Pagefind 搜索离线索引

## 📝 内容许可

- **教程**:本站原创,CC BY-NC-SA 4.0
- **官方文档镜像**:版权归 TypeSafe AI 所有,本文仅作中文索引
- **第三方文章**:版权归原作者所有

## 🤝 贡献

想收录项目/文章/教程?开 PR 到 `src/content/` 对应目录。

## 📜 致谢

- [TypeSafe AI](https://typesafe.ai) — 创作 Jev
- [Astro](https://astro.build) — 框架
- [Pagefind](https://pagefind.app) — 静态搜索
- 所有在 X / Discord 上讨论 Jev 的人

---

⚡ 本站与 TypeSafe AI **无隶属关系**,是非官方聚合站。
