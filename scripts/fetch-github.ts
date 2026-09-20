/**
 * Fetch / refresh awesome-typesafe project list with current star counts.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/awesome-typesafe.json');

interface Project {
  name: string;
  owner: string;
  description: string;
  url: string;
  stars: number;
  language: string | null;
  tags: string[];
}

// Seed list — update as new projects get added to the awesome-typesafe repo
const PROJECTS: Omit<Project, 'stars' | 'language'>[] = [
  { name: 'typesafe-sdk (Python)', owner: 'typesafe-ai', description: '官方 Python SDK,支持异步/同步客户端、retry policies、typed questions/responses。', url: 'https://github.com/typesafe-ai/typesafe-sdk-python', tags: ['SDK', '官方'] },
  { name: 'typesafe-sdk (JavaScript)', owner: 'typesafe-ai', description: '官方 JavaScript/TypeScript SDK,完整 TypeScript 类型。', url: 'https://github.com/typesafe-ai/typesafe-sdk-js', tags: ['SDK', '官方'] },
  { name: 'TypeSafe.AI.Sdk (.NET)', owner: 'hardkoded', description: '.NET 社区 SDK:dotnet add package TypeSafe.AI.Sdk', url: 'https://www.nuget.org/packages/TypeSafe.AI.Sdk', tags: ['SDK', '社区', '.NET'] },
  { name: 'awesome-typesafe', owner: 'AbdelStark', description: '社区维护的项目 / 实验 / 工具列表。提交你 cool 的 Jev 项目。', url: 'https://github.com/typesafe-ai/awesome', tags: ['列表', '社区'] },
  { name: 'skills (Agent skill)', owner: 'typesafe-ai', description: 'Drop-in skill for Claude Code / Codex,让 coding agent 直接用 Jev。', url: 'https://github.com/typesafe-ai/skills', tags: ['Agent', 'Claude Code', '官方'] },
  { name: 'Browser Use · Jev Ultrafast', owner: 'browser-use', description: '把网页拆成编号元素清单,让 Jev 选'做什么、对哪个'。机票搜索从 9.5 分钟缩短到 < 1 分钟。', url: 'https://github.com/browser-use/jev-ultrafast', tags: ['Agent', 'Browser Use'] },
  { name: 'pi-coding-agent bash guard', owner: 'gowthamgts', description: '用 Jev 给 pi coding agent 做 bash 命令安全检查。', url: 'https://github.com/gowthamgts/pi-jev-bash-guard', tags: ['Agent', '安全', 'guardrail'] },
  { name: 'lgtm', owner: 'jennmueng', description: '用 Jev 检查测试是否'无用'(没断言、没边界、没失败路径)。', url: 'https://github.com/jennmueng/lgtm', tags: ['DevTools', '测试'] },
  { name: 'cooksafe', owner: 'typesafe-ai', description: 'Cookbook 配套工具库:Playground 链接生成、缓存读取、可重现 notebook。', url: 'https://github.com/typesafe-ai/cooksafe', tags: ['官方', '工具'] },
  { name: 'Jev Doom Bot', owner: 'typesafe-ai', description: '官方 Doom bot demo,用 Jev 每秒 10 次决策驱动 NPC。', url: 'https://github.com/typesafe-ai/jev-doom-bot', tags: ['官方', 'Demo', '实时'] },
  { name: 'Jev Wikiracing', owner: 'typesafe-ai', description: 'Wikipedia 链接跳转游戏 demo,展示高 cardinality 决策。', url: 'https://github.com/typesafe-ai/jev-wikiracing', tags: ['官方', 'Demo'] },
];

async function fetchStars(repo: string): Promise<{ stars: number; language: string | null }> {
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'jev-hub-fetcher' },
    });
    if (!r.ok) return { stars: 0, language: null };
    const data = await r.json() as any;
    return { stars: data.stargazers_count ?? 0, language: data.language ?? null };
  } catch {
    return { stars: 0, language: null };
  }
}

async function main() {
  const results: Project[] = [];
  for (const p of PROJECTS) {
    const urlPath = new URL(p.url);
    const isGithub = urlPath.hostname === 'github.com' || urlPath.hostname === 'www.github.com';
    const isNuget = urlPath.hostname === 'www.nuget.org';
    if (!isGithub && !isNuget) continue;
    const repo = isGithub ? urlPath.pathname.replace(/^\//, '').replace(/\/$/, '') : null;
    const meta = repo ? await fetchStars(repo) : { stars: 0, language: null };
    results.push({ ...p, ...meta });
    console.log(`[fetch-github] ${p.name}: ${meta.stars} ⭐`);
  }
  await writeFile(OUT, JSON.stringify(results, null, 2));
  console.log(`[fetch-github] saved ${results.length} projects`);
}

main().catch((e) => { console.error(e); process.exit(1); });
