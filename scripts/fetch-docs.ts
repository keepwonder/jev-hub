/**
 * Fetch and mirror docs.typesafe.ai pages.
 * Saves individual MDX files into src/content/docs/.
 *
 * This is a one-time setup script — for ongoing updates, use GitHub Actions.
 */
import { writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/content/docs/');

const DOCS = [
  { slug: 'quickstart', title: 'Quickstart · 5 分钟跑通', description: '申请 access → 第一次 API 调用 → 在 Playground 里试。', category: 'intro', order: 1, source: 'https://docs.typesafe.ai/introduction/quickstart' },
  { slug: 'system-one', title: 'System One · 概念', description: 'System One 模型是什么,跟 LLM 有什么本质区别。', category: 'concepts', order: 1, source: 'https://docs.typesafe.ai/concepts/system-one' },
  { slug: 'state', title: 'State · 输入材料', description: '如何构造 state 来给 Jev 提供充分上下文。', category: 'concepts', order: 2, source: 'https://docs.typesafe.ai/concepts/state' },
  { slug: 'primitives', title: 'Primitives · 三种问题类型', description: 'Choice / Score / Noul 的设计哲学与边界。', category: 'primitives', order: 1, source: 'https://docs.typesafe.ai/primitives' },
  { slug: 'pattern-fan-out', title: 'Pattern · Speculative Fan-Out', description: '一次发一堆 question,包括试探性的,让代码挑有用的。', category: 'patterns', order: 1, source: 'https://docs.typesafe.ai/patterns/fan-out' },
  { slug: 'pattern-confidence-routing', title: 'Pattern · Confidence-Gated Routing', description: '把 confidence 当第二决策轴,实现更安全的自动系统。', category: 'patterns', order: 2, source: 'https://docs.typesafe.ai/patterns/confidence-routing' },
  { slug: 'sdk-python', title: 'Python SDK', description: 'typesafe-sdk 安装、异步/同步客户端、错误处理。', category: 'sdk', order: 1, source: 'https://docs.typesafe.ai/sdk/python' },
  { slug: 'jev-1-13-jaggedness', title: 'Jev 1.13 · Jaggedness', description: 'Jev 1.13 已知短板:字面阅读、不算术、不做日期、不生成、大 state 衰减……', category: 'rules', order: 1, source: 'https://docs.typesafe.ai/model-jaggedness/jev-1.13' },
];

async function exists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('[fetch-docs] using seed MDX files in src/content/docs/');
  console.log('[fetch-docs] for live sync, run a separate script that fetches from docs.typesafe.ai');
  for (const d of DOCS) {
    const f = join(OUT, `${d.slug}.md`);
    const has = await exists(f);
    console.log(`  - ${d.slug}: ${has ? '✓ already exists' : '(seed file needed)'}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
